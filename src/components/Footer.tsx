export const Footer = ({ color }: { color: string }) => {
  return (
    <footer
      className={` ${color} px-12 py-9 flex justify-between items-start md:px-44 pt-12 mt-4 m-auto`}
    >
      <div className="md:flex md:gap-24">
        <div className="md:flex-col">
          <p className="text-white text-xl font-bold mb-2">Nos applications</p>

          <div className="flex flex-col gap-1">
            <a href="" className="underline text-white">
              Bae : jeu de couple
            </a>
            <a href="" className="underline text-white">
              Vérité ou Vérité
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
