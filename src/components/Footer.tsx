export const Footer = ({ color }: { color: string }) => {
  return (
    <footer
      className={` ${color} px-12 py-9 flex justify-between items-start md:px-44 pt-12 mt-4 m-auto`}
    >
      <div className="md:flex md:gap-24">
        <div className="md:flex-col">
          <p className="text-white text-xl font-bold mb-2">Our apps</p>

          <div className="flex flex-col gap-1">
            <a href="" className="underline text-white">
              Bae: Couple Game
            </a>
            <a href="" className="underline text-white">
              Truth or Truth
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
