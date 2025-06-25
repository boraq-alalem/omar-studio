// حفظ الربط بين معرفين في جدول uuid عبر API
export async function saveUuidMapping({ id_local, id_remote }: { id_local: number, id_remote: number }) {
  const url = `/uuids?id_remote=${id_remote}&id_local=${id_local}`;
  // يفضل أن يكون POST أو PUT إذا كان الـ backend يدعم ذلك
  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) {
    throw new Error('فشل حفظ الربط بين المعرفين');
  }
  return response.json();
}
