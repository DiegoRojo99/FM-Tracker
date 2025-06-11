import React from "react";
import Image from "next/image";

const FootballLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full w-full">
    <Image
      src="/football.png"
      alt="Loading..."
      className="animate-spin mt-10"
      width={128}
      height={128}
      priority
    />
  </div>
);

export default FootballLoader;