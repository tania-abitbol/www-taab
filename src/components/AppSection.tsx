"use client";

import { FC, useState } from "react";
import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { Paginator } from "./Paginator";

interface AppSectionProps {
  name: string;
  logo: string;
  description: string;
  iosLink: string;
  reversed?: boolean;
}

export const AppSection: FC<AppSectionProps> = ({
  name,
  logo,
  description,
  iosLink,
  reversed,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    beforeChange: (_unused: any, newIndex: number) => setCurrentSlide(newIndex),
  };

  return (
    <section className="mb-12 md:mb-64 md:grid md:grid-cols-2 md:gap-32">
      <div className={`flex-1 ${reversed ? "md:order-2" : "order-1"}`}>
        <div
          className={`mb-3 flex ${
            reversed ? "justify-end" : "justify-start"
          } md:justify-start`}
        >
          <div className="flex flex-col">
            <img
              src={`/images/${logo}-logo.svg`}
              alt="Logo de l'application bae : jeu de couple"
              className={`w-9 md:w-20 mb-3 md:mb-7 ${
                reversed ? "self-end" : "self-start"
              } md:self-start`}
            />
            <h2
              className={`text-lg md:text-4xl font-body font-bold mb-6 uppercase ${
                reversed ? "underline-custom-right" : "underline-custom-left"
              }`}
            >
              {name}
            </h2>
          </div>
        </div>
        <p className="text-sm/normal md:text-base/normal mb-3 md:mb-7 font-body font-normal text-justify">
          {description}
        </p>
        <div className="flex gap-3 mb-12">
          <a href={iosLink}>
            <img src="/images/apple-store-logo.svg" />
          </a>
        </div>
      </div>
      <div className={`flex-1 ${reversed ? "md:order-1" : "order-2"}`}>
        <Slider {...settings}>
          {Array.from({ length: 4 }, (_, i) => i + 1).map((i) => (
            <div key={i}>
              <img
                src={`/images/${logo}/image_${i}.jpg`}
                className="w-full md:w-60"
              />
            </div>
          ))}
        </Slider>
        <Paginator
          currentSlide={currentSlide}
          totalSlides={4}
          color="bg-yellow"
        />
      </div>
    </section>
  );
};
