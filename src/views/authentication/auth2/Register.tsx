import { Link } from "react-router";
import CardBox from "src/components/shared/CardBox";

import AuthRegister from "../authforms/AuthRegister";

import FullLogo from "src/layouts/full/shared/logo/FullLogo";



const Register = () => {
  return (
    <>
      <div className="relative overflow-hidden h-screen bg-lightprimary dark:bg-darkprimary">
        <div className="flex h-full justify-center items-center px-4">
          <CardBox className="md:w-[450px] w-full border-none">
            <div className="mx-auto mb-6">
              <FullLogo />
            </div>
            <div className="mb-2 text-center">
              <h1 className="text-2xl font-semibold">WhatsAPI hesabı oluşturun</h1>
              <p className="mt-2 text-sm text-muted-foreground">E-posta doğrulamasından sonra yönetici onayı gerekir.</p>
            </div>
            <AuthRegister />
            <div className="flex gap-2 text-base text-ld font-medium mt-6 items-center justify-start">
              <p>Zaten hesabınız var mı?</p>
              <Link
                to={"/auth/login"}
                className="text-primary text-sm font-medium"
              >
                Giriş yapın
              </Link>
            </div>
          </CardBox>
        </div>
      </div>
    </>
  );
};

export default Register;
