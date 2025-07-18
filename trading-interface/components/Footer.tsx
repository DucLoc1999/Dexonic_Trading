"use client";

import React from "react";

const Footer: React.FC = () => {
  return (
    <div className="border-t border-[#3A3A3A] py-3 flex justify-evenly bg-[#000000] w-full">
      <p
        className="text-[#ffffff] text-sm underline cursor-pointer hover:text-[#01B792] transition-colors"
        style={{ fontFamily: "Montserrat" }}
      >
        Privacy
      </p>
      <p
        className="text-[#ffffff] text-sm underline cursor-pointer hover:text-[#01B792] transition-colors"
        style={{ fontFamily: "Montserrat" }}
      >
        Terms
      </p>
      <p
        className="text-[#ffffff] text-sm underline cursor-pointer hover:text-[#01B792] transition-colors"
        style={{ fontFamily: "Montserrat" }}
      >
        Docs
      </p>
    </div>
  );
};

export default Footer;
