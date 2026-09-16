import { Link } from "react-router";
import CardBox from "src/components/shared/CardBox";

import AuthLogin from "../authforms/AuthLogin";

import FullLogo from "src/layouts/full/shared/logo/FullLogo";


const Login = () => {
  return (
    <>
      <div className="relative overflow-hidden h-screen bg-lightprimary dark:bg-darkprimary">
        <div className="flex h-full justify-center items-center px-4">
          <CardBox className="md:w-[450px] w-full border-none">
            <div className="mx-auto mb-6">
              <FullLogo />
            </div>
            <div className="mb-2 text-center">
              <h1 className="text-2xl font-semibold">Tekrar hoş geldiniz</h1>
              <p className="mt-2 text-sm text-muted-foreground">WhatsApp operasyon panelinize giriş yapın.</p>
            </div>
            <AuthLogin />
            <div className="flex gap-2 text-base text-ld font-medium mt-6 items-center justify-center">
              <p>Henüz hesabınız yok mu?</p>
              <Link
                to={"/auth/register"}
                className="text-primary text-sm font-medium"
              >
                Hesap oluşturun
              </Link>
            </div>
          </CardBox>
        </div>
      </div>
    </>
  );
};

export default Login;
