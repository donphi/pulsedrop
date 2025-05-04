// app/settings/page.tsx
'use client'

import SettingsLayout from '@/components/layouts/SettingsLayout';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput'

export default function Settings() {
  return (
    <SettingsLayout>
      <form className="max-w-xl space-y-4">
        <TextInput id="name" label="Name" />
        <TextInput id="email" label="Email" type="email" />
        <Button type="submit">Save Changes</Button>
      </form>
    </SettingsLayout>
  );
}