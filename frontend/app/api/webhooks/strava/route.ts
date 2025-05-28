import { NextRequest, NextResponse } from 'next/server';
import { isValidWebhookEvent, enqueueWebhookEvent, processWebhookEvent } from '@/lib/stravaWebhook';
import { StravaWebhookEvent } from '@/lib/types/strava';
import { stravaSync } from '@/lib/config';

/**
 * Handle GET requests for webhook validation
 * Strava sends a GET request with a challenge when setting up a webhook
 * We need to respond with the challenge to verify ownership of the endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const challenge = searchParams.get('hub.challenge');
    const verifyToken = searchParams.get('hub.verify_token');
    
    // Validate the request
    if (!mode || !challenge || !verifyToken) {
      console.error('Invalid webhook validation request: missing parameters');
      return new NextResponse('Bad Request: Missing parameters', { status: 400 });
    }
    
    // Check if this is a subscription verification
    if (mode === 'subscribe') {
      // Verify the token matches our configured token
      const expectedToken = process.env.STRAVA_VERIFY_TOKEN;
      
      if (verifyToken !== expectedToken) {
        console.error('Invalid webhook validation request: token mismatch');
        return new NextResponse('Forbidden: Invalid verification token', { status: 403 });
      }
      
      // Return the challenge to confirm ownership
      return NextResponse.json({ 'hub.challenge': challenge });
    }
    
    // If not a subscription verification, return 400
    return new NextResponse('Bad Request: Invalid mode', { status: 400 });
  } catch (error) {
    console.error('Error handling webhook validation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * Handle POST requests for webhook events
 * Strava sends a POST request when an event occurs
 * We need to respond quickly (within 2 seconds) and process the event asynchronously
 */
export async function POST(request: NextRequest) {
  try {
    // Set a timeout to ensure we respond within the required timeframe
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Webhook processing timed out after ${stravaSync.webhook.responseTimeout}ms`));
      }, stravaSync.webhook.responseTimeout);
    });
    
    // Process the webhook event
    const processPromise = processWebhookRequest(request);
    
    // Race the processing against the timeout
    await Promise.race([processPromise, timeoutPromise]);
    
    // If we get here, the processing completed before the timeout
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to prevent Strava from retrying
    // We'll handle errors internally through our queue system
    return new NextResponse('OK', { status: 200 });
  }
}

/**
 * Process the webhook request
 * This is separated from the main POST handler to allow for timeout handling
 */
async function processWebhookRequest(request: NextRequest): Promise<void> {
  // Parse the request body
  const body = await request.json();
  
  // Validate the webhook event
  if (!isValidWebhookEvent(body)) {
    console.error('Invalid webhook event:', body);
    throw new Error('Invalid webhook event');
  }
  
  const event = body as StravaWebhookEvent;
  
  // Log the event (for debugging)
  console.log('Received webhook event:', {
    object_type: event.object_type,
    object_id: event.object_id,
    aspect_type: event.aspect_type,
    owner_id: event.owner_id,
    updates: event.updates
  });
  
  try {
    // Enqueue the event for async processing
    const eventId = await enqueueWebhookEvent(event);
    
    // Start async processing (don't await this)
    // This allows us to respond to Strava quickly while processing continues
    processWebhookEvent(eventId).catch(error => {
      console.error(`Error in background processing of webhook event ${eventId}:`, error);
    });
  } catch (error) {
    console.error('Failed to enqueue webhook event:', error);
    throw error;
  }
}