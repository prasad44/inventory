// Plain server component, no hooks, no client, no Supabase
export default async function TestDynPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <div style={{ padding: 20 }}>Test dynamic: {slug}</div>;
}
