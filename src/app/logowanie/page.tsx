import { LoginForm } from './login-form';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ blad?: string }> }) {
  const { blad } = await searchParams;

  return (
    <div className="flex min-h-screen flex-wrap">
      <section className="flex flex-[1_1_420px] flex-col justify-between gap-10 bg-navy px-10 py-12 text-white">
        <span className="text-[22px] font-bold tracking-wide">ZNP w CMKP</span>
        <div className="flex max-w-[520px] flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.08em] text-[#DCE5F0]">Związek Nauczycielstwa Polskiego</p>
          <h1 className="text-[40px] font-bold leading-tight">
            ZNP w CMKP
            <br />
            Panel członkowski
          </h1>
          <p className="text-lg leading-relaxed text-[#DCE5F0]">
            Aktualności, wydarzenia, dokumenty, legitymacja, składki i kontakt z zarządem w jednym miejscu.
          </p>
        </div>
        <p className="text-sm text-[#C3D1E2]">Centrum Medycznego Kształcenia Podyplomowego · Warszawa</p>
      </section>

      <main className="flex flex-[1_1_480px] items-center justify-center px-6 py-12">
        <div className="card flex w-full max-w-[440px] flex-col gap-5 p-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[26px] font-bold">Zaloguj się</h2>
            <p className="text-ink-muted">Użyj loginu i hasła otrzymanych od zarządu.</p>
          </div>
          {blad === 'konto' && (
            <p role="alert" className="rounded-lg bg-warn-light px-4 py-3 font-semibold text-warn">
              To konto jest nieaktywne. Skontaktuj się z zarządem.
            </p>
          )}
          <LoginForm />
          <p className="text-sm text-ink-muted">Nie pamiętasz hasła? Zarząd może je zresetować w panelu.</p>
          <div className="flex flex-col gap-2.5 rounded-lg bg-page p-4">
            <p className="font-semibold">Nie jesteś jeszcze członkiem?</p>
            <a href="/deklaracja" className="btn-danger">
              Złóż deklarację członkowską
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
