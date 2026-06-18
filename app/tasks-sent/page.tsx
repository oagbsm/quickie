import Link from "next/link";

export default function TasksSentPage() {
  return (
    <main className="min-h-screen bg-[#071638] px-4 py-4 text-[#071638] sm:px-6 lg:flex lg:items-center lg:justify-center lg:px-8 lg:py-3">
      <section className="mx-auto grid min-h-[calc(100vh-32px)] w-full max-w-[500px] overflow-hidden rounded-[30px] bg-white shadow-[0_20px_64px_rgba(0,0,0,0.24)] lg:min-h-[545px] lg:max-w-[900px] lg:grid-cols-[0.9fr_1.1fr] lg:rounded-[34px]">
        <aside className="relative overflow-hidden bg-gradient-to-br from-[#071638] via-[#08204d] to-[#053f21] px-5 pb-6 pt-6 text-white lg:flex lg:flex-col lg:justify-between lg:px-8 lg:py-8">
          <div className="relative z-10 mx-auto mt-6 flex max-w-[330px] flex-col items-center text-center lg:mx-0 lg:mt-7 lg:items-start lg:text-left">
            <div className="flex h-[145px] w-[145px] items-center justify-center rounded-full bg-[#eaf8ef] shadow-[inset_0_0_0_7px_rgba(255,255,255,0.72)] lg:h-[184px] lg:w-[184px]">
              <div
                role="img"
                aria-label="Kola the Quickola koala"
                className="h-[140px] w-[140px] bg-contain bg-center bg-no-repeat lg:h-[180px] lg:w-[180px]"
                style={{
                  backgroundImage:
                    "url('/quickola_koala_cutout.png'), url('/quickola-koala-cutout.png'), url('/quickola_koala_cutout.jpeg'), url('/quickola-koala-cutout.jpeg')",
                }}
              />
            </div>

            <h1 className="mt-4 max-w-[360px] text-[32px] font-black leading-[0.92] tracking-[-0.07em] text-white sm:text-[38px] lg:mt-6 lg:text-[50px]">
              Your home task has been <span className="text-[#07833f]">posted!</span>
            </h1>

            <p className="mt-3 max-w-[320px] text-[13px] font-semibold leading-[1.4] text-white/78 lg:text-[15px]">
              We’ll send your task to trusted local taskers in your area.
            </p>
          </div>

          <div className="relative z-10 mt-5 hidden rounded-[22px] border border-white/12 bg-white/10 p-4 backdrop-blur lg:block">
            <p className="text-[11px] font-black uppercase tracking-[-0.02em] text-[#c8f7d9]">
              What happens next?
            </p>
            <p className="mt-2 text-[13px] font-bold leading-[1.35] text-white/78">
              We check your task and photos, then notify local taskers.
            </p>
          </div>


          <span className="rounded-full bg-[#11a84f] px-2.5 py-1 text-[10px] font-black uppercase tracking-[-0.02em] text-white">
            New
          </span>
        </aside>

        <div className="flex flex-col justify-center bg-white px-5 py-5 sm:px-7 lg:bg-[#f8fbff] lg:px-9 lg:py-8 xl:px-11">
          <div className="rounded-[20px] border border-[#b9e6ca] bg-[#fbfffd] p-4 text-left shadow-[0_8px_22px_rgba(7,22,56,0.04)] sm:p-4 lg:rounded-[24px] lg:bg-white lg:p-5">
            <h2 className="text-[19px] font-black tracking-[-0.05em] text-[#071638] lg:text-[24px]">
              What happens next?
            </h2>

            <div className="mt-3 space-y-0 divide-y divide-[#e4ebf1]">
              {[
                "We check your task and photos",
                "We notify local taskers",
                "Available taskers contact you with a price",
                "You choose who to book",
              ].map((item, index) => (
                <div key={item} className="flex gap-3 py-2.5 first:pt-0 last:pb-0 lg:gap-3 lg:py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf8ef] text-[12px] font-black text-[#07833f] lg:h-8 lg:w-8 lg:text-[13px]">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-[13px] font-extrabold leading-[1.28] tracking-[-0.02em] text-[#071638] sm:text-[14px] lg:text-[14px]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/"
            className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-[16px] bg-[#07833f] px-5 text-[15px] font-black tracking-[-0.03em] text-white shadow-[0_12px_26px_rgba(7,131,63,0.2)] transition hover:-translate-y-0.5 hover:bg-[#066f36] lg:mt-0 lg:min-h-[50px] lg:text-[15px]"
          >
            Back to homepage
          </Link>
        </div>
      </section>
    </main>
  );
}