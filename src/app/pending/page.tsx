export default function Page() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-3 text-xl font-bold">আমার বাড়ি</h1>
      <p>আপনার অ্যাকাউন্ট অনুমোদনের অপেক্ষায় আছে। সুপার অ্যাডমিন অনুমোদন দিলে আপনি প্রবেশ করতে পারবেন।</p>
      <form action="/auth/signout" method="post" className="mt-6">
        <button className="btn-quiet" type="submit">লগ আউট</button>
      </form>
    </main>
  );
}
