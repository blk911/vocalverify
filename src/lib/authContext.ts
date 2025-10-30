import { cookies } from 'next/headers';

export async function getAuthUser() {
  // Replace this with real cookie/session lookup later
  const cookieStore = await cookies();
  const memberCode = cookieStore.get('memberCode')?.value || null;
  return memberCode;
}
