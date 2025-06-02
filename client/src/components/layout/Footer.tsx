import Link from "next/link";

const Footer = () => {
  return (
    <footer className="flex justify-center">
      <div className="flex max-w-[960px] flex-1 flex-col">
        <footer className="flex flex-col gap-6 px-5 py-10 text-center @container">
          <div className="flex flex-wrap items-center justify-center gap-6 @[480px]:flex-row @[480px]:justify-around">
            <Link
              href="#"
              className="text-[#51946b] text-base font-normal leading-normal min-w-40"
            >
              About Us
            </Link>
            <Link
              href="#"
              className="text-[#51946b] text-base font-normal leading-normal min-w-40"
            >
              Contact
            </Link>
            <Link
              href="#"
              className="text-[#51946b] text-base font-normal leading-normal min-w-40"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-[#51946b] text-base font-normal leading-normal min-w-40"
            >
              Terms of Service
            </Link>
          </div>
          <p className="text-[#51946b] text-base font-normal leading-normal">
            @2023 Book Haven. All rights reserved.
          </p>
        </footer>
      </div>
    </footer>
  );
};

export default Footer;
