import React from "react";
import Image from "next/image";

const FootballLoader: React.FC = () => (
  <div className="flex flex-grow items-center justify-center">
    <Image
      src="/football.png"
      alt="Loading..."
      className="animate-spin"
      width={128}
      height={128}
      priority
    />
  </div>
);

export default FootballLoader;