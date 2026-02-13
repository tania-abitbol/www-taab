import Head from "next/head";
import Link from "next/link";

const APP_STORE_URL =
  "https://apps.apple.com/fr/app/bae-jeu-de-couple/id1574150149";

/**
 * Fallback web pour le Universal Link
 * https://taabapps.com/bae/reconnect
 * (ouvert si Bae n'est pas installée)
 */
const BaeReconnectPage = () => (
  <>
    <Head>
      <title>Bae — Reconnect as a Couple</title>
      <meta
        name="description"
        content="Reconnectez-vous en couple avec Bae : un pack de questions pensé pour raviver votre lien."
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <main className="min-h-screen px-6 md:px-32 py-16 max-w-3xl m-auto font-body">
      <p className="text-sm uppercase tracking-wide text-gray-500 mb-4">Bae</p>
      <h1 className="text-3xl md:text-5xl font-bold mb-4 text-blue-700">
        Reconnect as a Couple
      </h1>
      <p className="text-lg text-gray-700 leading-relaxed mb-8">
        Un moment à deux pour vous reconnecter. Ouvrez Bae pour lancer le
        challenge « Se reconnecter » — des questions personnalisées pour
        raviver votre lien.
      </p>
      <a
        href={APP_STORE_URL}
        className="inline-block rounded-xl bg-blue-700 text-white px-6 py-3 text-lg font-semibold hover:bg-blue-800 transition-colors"
      >
        Télécharger Bae sur l&apos;App Store
      </a>
      <p className="mt-10 text-sm text-gray-500">
        Déjà installée ? Ouvrez ce lien sur votre iPhone pour lancer Bae
        directement.{" "}
        <Link href="/" className="underline">
          Retour au site TAAB
        </Link>
      </p>
    </main>
  </>
);

export default BaeReconnectPage;
