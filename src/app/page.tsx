"use client";

import { AppSection } from "~/components/AppSection";
import { ProgressBar } from "~/components/progressBar";
import { Footer } from "~/components/Footer";

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <div className="min-h-screen px-4 md:px-44 pt-12 max-w-[1512px] m-auto">
        <ProgressBar color="bg-yellow" bg="bg-yellow-lighter" />

        <div className="relative">
          <div className="flex">
            <p className="z-30 text-2xl md:text-8xl/normal font-semibold text-center px-6 mb-14 md:mb-28 font-title leading-relaxed">
              TAAB THE STUDIO CREATING{" "}
              <span className="text-white rotating-background md:text-8xl">
                ENTERTAINMENT
              </span>{" "}
              MOBILE APPS
            </p>
          </div>
          <img
            src="/images/itemTitle1.svg"
            alt=""
            className="absolute w-10 top-0 left-12 md:w-32 md:left-52"
          />
          <img
            src="/images/itemTitle2.svg"
            alt=""
            className="absolute w-10 top-20 md:top-64 right-0 md:w-32 md:right-8"
          />
          <img
            src="/images/itemTitle3.svg"
            alt=""
            className="absolute w-10 bottom-20 left-20 md:bottom-52  md:w-32 md:left-80"
          />
        </div>

        <AppSection
          name="Bae: Couple Game"
          logo="bae"
          description="If you are looking for an app that helps you rediscover your relationship, strengthen your emotional bond, and break out of the daily routine, you will love Bae, the quiz app for couples!"
          iosLink="https://apps.apple.com/fr/app/bae-jeu-de-couple/id1574150149"
        />
        <AppSection
          name="TRUTH OR TRUTH"
          logo="vérité"
          description="Discover Truth or Truth, an app that turns your phone into the ultimate accessory for nights out with friends. Dive into a captivating social adventure with Truth or Truth, the lively app that redefines group entertainment!"
          iosLink="https://apps.apple.com/fr/app/v%C3%A9rit%C3%A9-ou-v%C3%A9rit%C3%A9/id6480046704"
          reversed
        />
        <div className="lg:flex items-center gap-20 mb-24 md:mb-52">
          <div className="lg:min-w-max mt-20 mb-9 md:mb-0 order-1 md:order-2 relative">
            <img src="/images/map.svg" alt="" className="" />
            <img
              src="/images/point.svg"
              alt=""
              className="w-6 md:w-10 absolute top-12 left-6 md:top-28 md:left-14 animate-pulse"
            />
            <img
              src="/images/point.svg"
              alt=""
              className="w-6 md:w-10 absolute top-12 right-6 md:top-28 md:right-14 animate-pulse"
            />
            <img
              src="/images/point.svg"
              alt=""
              className="w-6 md:w-10 absolute top-20 right-36 md:top-52 md:right-52 animate-pulse"
            />
            <img
              src="/images/point.svg"
              alt=""
              className="w-6 md:w-10 absolute top-24 left-12 md:top-72 md:left-44 animate-pulse"
            />
            <img
              src="/images/point.svg"
              alt=""
              className="w-6 md:w-10 absolute top-24 left-44 md:top-44 md:left-72 animate-pulse"
            />
          </div>
          <div>
            <h3 className="text-3xl md:text-6xl font-body font-bold mb-4">
              International
            </h3>
            <p className="text-sm/normal md:text-xl/normal font-body font-normal text-gray-500-500 text-justify">
              Our apps are a major success and are available and actively used
              in many countries around the world, including Spanish-speaking,
              English-speaking, and French-speaking regions. From Spain and
              Mexico to the United States, the United Kingdom, France, and
              Canada, they keep entertaining millions of people.
            </p>
          </div>
        </div>

        <div className="md:flex mb-24 md:mb-52 md:gap-32">
          <div className="md:flex-col">
            <div className="md:flex md:gap-20">
              <div className="flex flex-col mb-6">
                <h3 className="text-6xl font-bold mb-2">
                  5<span className="text-[#f394d0]">+</span>
                </h3>
                <p className="font-bold text-gray-500">
                  New apps in under 1 year
                </p>
              </div>

              <div className="flex flex-col mb-6 ">
                <div className="self-end md:gap-20">
                  <h3 className="text-6xl font-bold mb-2 self-end">
                    1M<span className="text-[#f394d0]">+</span>
                  </h3>
                  <p className="font-bold text-gray-500 self-end">
                    Downloads
                  </p>
                </div>
              </div>
            </div>
            <div className="md:flex md:gap-20">
              <div className="flex flex-col mb-6">
                <h3 className="text-6xl font-bold mb-2">
                  1500<span className="text-[#f394d0]">+</span>
                </h3>
                <p className="font-bold text-gray-500">Positive reviews</p>
              </div>

              <div className="flex flex-col mb-10">
                <div className="self-end">
                  <h3 className="text-6xl font-bold mb-2 self-end">
                    50<span className="text-[#f394d0]">+</span>
                  </h3>
                  <p className="font-bold text-gray-500 self-end">
                    Countries reached
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="md-flex-col">
            <h3 className="text-3xl font-bold mb-4 md:text-6xl">
              The numbers
            </h3>
            <p className="text-sm/normal md:text-xl/normal font-body font-normal text-gray-500 text-justify">
              We are open about our numbers, and proud that people around the
              world spend quality time with the people they love through our
              apps. We are committed to creating meaningful, entertaining
              experiences that bring friends and families closer together.
            </p>
          </div>
        </div>

        <div className="md:flex md:justify-between">
          <h3 className="font-medium text-3xl mb-12 leading-normal md:w-1/2 md:text-4xl">
            A{" "}
            <span className="font-extrabold">
              request <span className="text-[#f394d0]">?</span>
            </span>{" "}
            A{" "}
            <span className="font-extrabold">
              question <span className="text-[#f394d0]">?</span>
            </span>{" "}
            Ideas for{" "}
            <span className="font-extrabold">
              improvement <span className="text-[#f394d0]">?</span>
            </span>
          </h3>

          <a className="bg-black md:w-1/2  text-white w-full text-md font-semibold  py-3 px-4 rounded-xl mb-24 md:mb-28 md:max-w-72 text-center">
            Contact us: contact@taabapps.com
          </a>
        </div>
      </div>
      <Footer color="bg-black" />
    </main>
  );
}
