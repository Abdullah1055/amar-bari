export default function Page() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-3 text-xl font-bold">আমার বাড়ি</h1>
      <p>আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে। সহায়তার জন্য প্ল্যাটফর্ম কর্তৃপক্ষের সাথে যোগাযোগ করুন।</p>
      <form action="/auth/signout" method="post" className="mt-6">
        <button className="btn-quiet" type="submit">লগ আউট</button>
      </form>
    </main>
  );
}
