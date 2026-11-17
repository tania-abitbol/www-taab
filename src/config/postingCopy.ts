import type { PostingLang } from "~/config/posting";

type Phrases = {
  create: (first: string, second: string, third: string) => string;
  username: string;
  noProfile: string;
  warm: (account: string, before?: string) => string;
  post: (account: string) => string;
  postWarmBefore: (account: string, goal?: string) => string;
  postWarmAfter: (account: string) => string;
  tuesdayWarmBefore: (account: string, goal?: string, forYou?: string) => string;
  tuesdayForYou: string;
  forYouWarmBefore: (account: string) => string;
  tuesdayPost: (account: string) => string;
  tuesdayWarmAfter: (account: string) => string;
  tuesdayClose: (account: string) => string;
  tuesdayStay: (account: string) => string;
  tuesdayFocus: (account: string) => string;
  followTotal: (count: number) => string;
  followTotalLong: (count: number) => string;
  focusGoal: (count: number) => string;
  focusNoPost: (account: string, count: number) => string;
  profile: (account: string) => string;
  photoRule: string;
  photoMonday: string;
  bioTitle: string;
  bioTuesday: string;
  bioRule: string;
  thenWarm: string;
  noPostToday: string;
  engageMore: string;
  hardRules: string;
  hardBefore: (account: string) => string;
  hardPost: (account: string) => string;
  videoPost: (account: string) => string;
  hardAfter: (account: string, count: number, reply: boolean) => string;
  hardWarm: (account: string, count: number, reply: boolean) => string;
  hardProfileWarm: (account: string, count: number, reply: boolean) => string;
  sundayBefore: (account: string) => string;
  sundayAfter: (account: string, reply: boolean) => string;
  bilan: string;
};

export const block = (...parts: Array<string | undefined>) => parts.filter((part) => part && part.trim()).join("\n");

const phrases: Record<PostingLang, Phrases> = {
  fr: {
    create: (first, second, third) =>
      block(
        "Crée 3 comptes TikTok neufs.",
        `Un pour le ${first}, un pour le ${second}, un pour le ${third}.`,
        "• Chacun part de zéro",
        "• Pas un compte déjà ouvert",
        "• Un e-mail ou un numéro de téléphone de ton pays",
        "• Le compte t'appartient",
        "• Je ne le reprendrai jamais",
        "• Tu peux supprimer les comptes sans souci",
        "• Tu n'enregistres pas cette partie",
        "• Il peut y avoir des mots de passe"
      ),
    username: block(
      "Nom d'utilisateur",
      "• Un prénom courant de fille",
      "• Dans le pays où tu postes",
      "• C'est toi qui choisis",
      "• Pas un nom en rapport avec mes applications"
    ),
    noProfile: block("Pas de photo et pas de bio", "• Tu ne mets ni photo de profil ni bio", "• Tu crées seulement les comptes"),
    warm: (account, before = "") =>
      block(
        account,
        before.trim(),
        "Reste dessus, comme si c'était ton TikTok.",
        "Passe un bon moment.",
        "• Fais défiler, regarde ce qui t'intéresse",
        "• Tu n'aimes pas tout",
        "• Un like, seulement quand ça te plaît vraiment",
        "• Tu ne postes rien"
      ),
    postWarmBefore: (account, goal) =>
      block(
        account,
        "Échauffement.",
        goal,
        "Reste dessus, comme si c'était ton TikTok.",
        "• Fais défiler, regarde ce qui t'intéresse",
        "• Un like, seulement quand ça te plaît vraiment"
      ),
    post: (account) =>
      block(
        account,
        "Tu postes le diaporama du jour.",
        "• Il est sur cette page, tu le télécharges",
        "• Choisis une musique dans TikTok",
        "• Appuie sur Publier",
        "• Attends de voir la vidéo sur le profil"
      ),
    postWarmAfter: (account) =>
      block(
        account,
        "Échauffement après.",
        "Reste dessus, comme si c'était ton TikTok.",
        "• Fais défiler, regarde ce qui t'intéresse",
        "• Tu ne postes plus"
      ),
    tuesdayWarmBefore: (account, goal, forYou) =>
      block(
        account,
        "Échauffement précis.",
        goal,
        "• Va sur 5 comptes d'influenceurs de ton pays que tu connais. Abonne-toi, regarde leurs vidéos, et réponds à des commentaires déjà là.",
        forYou ?? "• Retourne sur le Pour toi. Défile, abonne-toi et commente au moins 5 vidéos."
      ),
    tuesdayForYou:
      "• Retourne sur le Pour toi. Défile, comporte-toi normalement et interagis avec les vidéos (likes, commentaires, abonnements) quand ça t'intéresse et que c'est du contenu de ton pays.",
    forYouWarmBefore: (account) =>
      block(
        account,
        "Échauffement précis.",
        "• Va sur la page Pour toi. Défile, comporte-toi normalement et interagis avec les vidéos (likes, commentaires, abonnements) quand ça t'intéresse et que c'est du contenu de ton pays."
      ),
    tuesdayPost: (account) =>
      block(
        account,
        "Tu postes le diaporama du jour.",
        "• Tu le télécharges ici.",
        "• Choisis une musique TikTok du moment, une que tu connais et que tu entends souvent.",
        "• Copie cette description.",
        "• Appuie sur Publier.",
        "• Attends de voir la vidéo sur le profil."
      ),
    tuesdayWarmAfter: (account) =>
      block(
        account,
        "Échauffement après.",
        "• Retourne sur le Pour toi.",
        "• Fais défiler, regarde ce qui t'intéresse.",
        "• Tu ne postes plus.",
        "• Interagis de façon naturelle."
      ),
    tuesdayClose: (account) =>
      block(
        account,
        "• Retourne sur le Pour toi.",
        "• Fais défiler, regarde ce qui t'intéresse.",
        "• Tu ne postes plus.",
        "• Interagis de façon naturelle.",
        "• Abonne-toi à des comptes de ton pays quand le contenu te plaît."
      ),
    tuesdayStay: (account) =>
      block(
        account,
        "Reste dessus, comme si c'était ton TikTok.",
        "Passe un bon moment.",
        "• Défile, regarde ce qui t'intéresse.",
        "• Un like, seulement quand ça te plaît vraiment.",
        "• Abonne-toi à des créateurs de ton pays quand une vidéo te plaît, puis montre le profil.",
        "• Tu ne postes rien."
      ),
    tuesdayFocus: (account) =>
      block(
        account,
        "• Défile comme si c'était ton TikTok. Passe un bon moment. Commente, et réponds à des commentaires déjà là.",
        "• Va sur des influenceurs que tu connais, pas trop connus, pour que TikTok voie que tu es du pays.",
        "• Tu n'aimes pas tout.",
        "• Un like seulement quand ça te plaît vraiment."
      ),
    hardRules: block(
      "Règles",
      "• Une seule vidéo, sans coupure, du début à la fin.",
      "• Coche une tâche seulement si on la voit dans la vidéo."
    ),
    hardBefore: (account) =>
      block(
        account,
        "Échauffement avant.",
        "• Montre ton profil : le nombre d'abonnements de départ doit être lisible.",
        "• Pour toi : regarde chaque vidéo 5 à 10 secondes. Ne fais pas défiler toutes les 2 secondes.",
        "• Like seulement ce qui te plaît vraiment, de créateurs de ton pays, pas les plus connus tout le temps, jamais à la chaîne.",
        "• Au moins 3 commentaires, 2 réponses à des commentaires, et plusieurs abonnements."
      ),
    hardPost: (account) =>
      block(
        account,
        "Publication.",
        "• Prépare le diaporama et la description avant d'enregistrer.",
        "• Tu le télécharges ici.",
        "• Musique TikTok tendance.",
        "• Copie cette description, puis colle-la.",
        "• Appuie sur Publier. Si ça rate, recommence tout de suite, avant de changer de compte.",
        "• Montre la vidéo dans la grille."
      ),
    videoPost: (account) =>
      block(
        account,
        "Publication.",
        "• Prépare la vidéo et la description avant d'enregistrer.",
        "• Tu télécharges la vidéo ici.",
        "• Pas de musique.",
        "• Copie cette description, puis colle-la.",
        "• Appuie sur Publier. Si ça rate, recommence tout de suite, avant de changer de compte.",
        "• Montre la vidéo dans la grille."
      ),
    hardAfter: (account, count, reply) =>
      block(
        account,
        "Après la publication.",
        "• Reste 7 minutes sur Pour toi : regarde, commente et abonne-toi.",
        "• Au moins 3 commentaires, 2 réponses à des commentaires, et plusieurs abonnements.",
        "• Like seulement ce qui te plaît vraiment, de créateurs de ton pays, pas les plus connus tout le temps, jamais à la chaîne.",
        reply ? "• Réponds aux commentaires sous le post d'hier." : undefined,
        `• Fin obligatoire : montre ton profil avec ${count} abonnements ou plus, bien lisibles. Ne le montre pas en coup de vent pour changer de compte.`
      ),
    hardWarm: (account, count, reply) =>
      block(
        account,
        "Échauffement, minuteur de 20 minutes. Tu ne publies pas.",
        "• Montre ton profil au début.",
        "• Reste 20 vraies minutes sur ce compte.",
        "• Pour toi : regarde chaque vidéo 5 à 10 secondes.",
        "• Like seulement ce qui te plaît vraiment, de créateurs de ton pays, pas les plus connus tout le temps, jamais à la chaîne.",
        "• Au moins 3 commentaires, 2 réponses à des commentaires, et plusieurs abonnements.",
        reply ? "• Réponds aux commentaires sous le post d'hier." : undefined,
        `• Fin obligatoire : montre ton profil avec ${count} abonnements ou plus, bien lisibles. Ne le montre pas en coup de vent pour changer de compte.`
      ),
    hardProfileWarm: (account, count, reply) =>
      block(
        account,
        "Échauffement du nouveau compte. Tu ne publies pas.",
        "• Montre ton profil.",
        "• Pour toi : regarde chaque vidéo 5 à 10 secondes.",
        "• Like seulement ce qui te plaît vraiment, de créateurs de ton pays, pas les plus connus tout le temps, jamais à la chaîne.",
        "• Au moins 3 commentaires, 2 réponses à des commentaires, et plusieurs abonnements.",
        reply ? "• Réponds aux commentaires sous le post d'hier." : undefined,
        `• Fin obligatoire : montre ton profil avec ${count} abonnements ou plus, bien lisibles. Ne le montre pas en coup de vent pour changer de compte.`
      ),
    sundayBefore: (account) =>
      block(
        account,
        "Échauffement avant.",
        "• Pour toi : regarde chaque vidéo 5 à 10 secondes. Ne fais pas défiler toutes les 2 secondes.",
        "• Like seulement ce qui te plaît vraiment, de créateurs de ton pays, pas les plus connus tout le temps, jamais à la chaîne.",
        "• Au moins 3 commentaires, 2 réponses à des commentaires, et plusieurs abonnements."
      ),
    sundayAfter: (account, reply) =>
      block(
        account,
        "Après la publication.",
        "• Reste 7 minutes sur Pour toi : regarde, commente et abonne-toi.",
        "• Au moins 3 commentaires, 2 réponses à des commentaires, et plusieurs abonnements.",
        "• Like seulement ce qui te plaît vraiment, de créateurs de ton pays, pas les plus connus tout le temps, jamais à la chaîne.",
        reply ? "• Réponds aux commentaires sous le post d'hier." : undefined
      ),
    bilan: block(
      "Bilan fin de semaine",
      "Dans les 5 dernières minutes de la vidéo de preuves.",
      "• Passe sur chacun des comptes.",
      "• Montre les résultats de vues et le nombre d'abonnements.",
      "• Sur chaque compte, ouvre les analytics de la vidéo qui a le plus de vues.",
      "• Montre la répartition homme / femme et les pays ciblés."
    ),
    followTotal: (count) => `Tu dois avoir ${count} abonnements ou plus au total sur le compte.`,
    followTotalLong: (count) =>
      `Tu dois avoir ${count} abonnements ou plus au total sur le compte. À la fin de la session de ce compte, montre-moi le profil pour valider qu'il y a bien ${count} abonnements ou plus.`,
    focusGoal: (count) =>
      `Objectif : au moins ${count} abonnements à la fin, et montrer à TikTok que tu es une vraie personne.`,
    focusNoPost: (account, count) =>
      block(
        account,
        "Focus objectif.",
        `Objectif : au moins ${count} abonnements à la fin, et montrer à TikTok que tu es une vraie personne.`,
        "• Défile comme si c'était ton TikTok. Passe un bon moment. Commente, et réponds à des commentaires déjà là.",
        "• Va sur des influenceurs que tu connais, pas trop connus, pour que TikTok voie que tu es du pays.",
        "• Tu n'aimes pas tout.",
        `• Abonne-toi jusqu'à au moins ${count} abonnements.`,
        "• Un like seulement quand ça te plaît vraiment."
      ),
    profile: (account) => block(account, "Écris une bio et mets une photo de profil."),
    photoRule: block("La photo", "• Elle vient de Pinterest, ou c'est une photo que tu as déjà", "• Pas d'image générée par IA"),
    photoMonday: block(
      "La photo",
      "• Un screen d'une fille sur Pinterest, ou une photo que tu as déjà",
      "• Pas d'image générée par IA"
    ),
    bioTitle: "La bio",
    bioTuesday: "conseils amitié & meilleures amies 🫶 toujours avec le jeu vérité ou vérité",
    bioRule: block("La bio", "• Naturelle, écrite par toi", "• Elle ne parle pas des applications", "• Pas de texte généré par IA"),
    thenWarm: "Ensuite.",
    noPostToday: "Tu ne postes pas aujourd'hui.",
    engageMore:
      "Aujourd'hui, abonne-toi un peu plus, like et commente un peu plus. Engage-toi un peu plus dans les vidéos. Tu peux en swiper plein si elles ne t'intéressent pas.",
  },
  es: {
    create: (first, second, third) =>
      block(
        "Crea 3 cuentas de TikTok nuevas.",
        `Una para ${first}, una para ${second} y una para ${third}.`,
        "• Cada una empieza de cero",
        "• No uses una cuenta ya abierta",
        "• Un correo o un número de tu país",
        "• La cuenta es tuya",
        "• Nunca me la quedaré",
        "• Puedes borrar las cuentas sin problema",
        "• No grabes esta parte",
        "• Puede haber contraseñas"
      ),
    username: block(
      "Nombre de usuario",
      "• Un nombre común de chica",
      "• Del país donde publicas",
      "• Lo eliges tú",
      "• Nada relacionado con mis aplicaciones"
    ),
    noProfile: block("Sin foto y sin bio", "• Ni foto de perfil ni bio", "• Solo creas las cuentas"),
    warm: (account, before = "") =>
      block(
        account,
        before.trim(),
        "Como si fuera tu TikTok.",
        "Pasa un buen rato.",
        "• Desliza, mira lo que te interesa",
        "• No des like a todo",
        "• Un like, solo cuando de verdad te guste",
        "• No publicas nada"
      ),
    postWarmBefore: (account, goal) =>
      block(
        account,
        "Calentamiento.",
        goal,
        "Como si fuera tu TikTok.",
        "• Desliza, mira lo que te interesa",
        "• Un like, solo cuando de verdad te guste"
      ),
    post: (account) =>
      block(
        account,
        "Publicas el carrusel del día.",
        "• Está en esta página, lo descargas",
        "• Elige una música en TikTok",
        "• Pulsa Publicar",
        "• Espera a ver el vídeo en el perfil"
      ),
    postWarmAfter: (account) =>
      block(
        account,
        "Calentamiento después.",
        "Como si fuera tu TikTok.",
        "• Desliza, mira lo que te interesa",
        "• Ya no publicas"
      ),
    tuesdayWarmBefore: (account, goal, forYou) =>
      block(
        account,
        "Calentamiento preciso.",
        goal,
        "• Entra en 5 cuentas de influencers de tu país que conoces. Síguelas, mira sus vídeos y responde a comentarios que ya están ahí.",
        forYou ?? "• Vuelve al Para ti. Desliza, suscríbete y comenta al menos 5 vídeos."
      ),
    tuesdayForYou:
      "• Vuelve al Para ti. Desliza, compórtate con normalidad e interactúa con los vídeos (likes, comentarios, seguimientos) cuando te interese y sea contenido de tu país.",
    forYouWarmBefore: (account) =>
      block(
        account,
        "Calentamiento preciso.",
        "• Ve a la página Para ti. Desliza, compórtate con normalidad e interactúa con los vídeos (likes, comentarios, seguimientos) cuando te interese y sea contenido de tu país."
      ),
    tuesdayPost: (account) =>
      block(
        account,
        "Publicas el carrusel del día.",
        "• Lo descargas aquí.",
        "• Elige una música de TikTok del momento, una que conoces y que oyes a menudo.",
        "• Copia esta descripción.",
        "• Pulsa Publicar.",
        "• Espera a ver el vídeo en el perfil."
      ),
    tuesdayWarmAfter: (account) =>
      block(
        account,
        "Calentamiento después.",
        "• Vuelve al Para ti.",
        "• Desliza, mira lo que te interesa.",
        "• Ya no publicas.",
        "• Interactúa con naturalidad."
      ),
    tuesdayClose: (account) =>
      block(
        account,
        "• Vuelve al Para ti.",
        "• Desliza, mira lo que te interesa.",
        "• Ya no publicas.",
        "• Interactúa con naturalidad.",
        "• Sigue cuentas de tu país cuando el contenido te guste."
      ),
    tuesdayStay: (account) =>
      block(
        account,
        "Quédate, como si fuera tu TikTok.",
        "Pasa un buen rato.",
        "• Desliza, mira lo que te interesa.",
        "• Un like, solo cuando de verdad te guste.",
        "• Sigue a creadores de tu país cuando un vídeo te guste, y luego muestra el perfil.",
        "• No publicas nada."
      ),
    tuesdayFocus: (account) =>
      block(
        account,
        "• Desliza como si fuera tu TikTok. Pasa un buen rato. Comenta y responde a comentarios que ya están ahí.",
        "• Entra en influencers que conoces, no muy conocidos, para que TikTok vea que eres del país.",
        "• No le des like a todo.",
        "• Un like solo cuando de verdad te guste."
      ),
    hardRules: block(
      "Reglas",
      "• Un solo vídeo, sin cortes, de principio a fin.",
      "• Marca una tarea solo si se ve en el vídeo."
    ),
    hardBefore: (account) =>
      block(
        account,
        "Calentamiento antes.",
        "• Muestra tu perfil: el número de seguidos del inicio tiene que leerse bien.",
        "• Ve a Para ti y mira cada vídeo de 5 a 10 segundos. No deslices cada 2 segundos.",
        "• Like solo lo que de verdad te guste, de creadores de tu país, no siempre los más conocidos, nunca varios seguidos.",
        "• Al menos 3 comentarios, 2 respuestas a comentarios, y varios seguidos."
      ),
    hardPost: (account) =>
      block(
        account,
        "Publicación.",
        "• Prepara el carrusel y la descripción antes de grabar.",
        "• Lo descargas aquí.",
        "• Música de TikTok que esté de moda.",
        "• Copia esta descripción, luego pégala.",
        "• Pulsa Publicar. Si falla, inténtalo otra vez enseguida, antes de cambiar de cuenta.",
        "• Muestra el vídeo en la cuadrícula."
      ),
    videoPost: (account) =>
      block(
        account,
        "Publicación.",
        "• Prepara el vídeo y la descripción antes de grabar.",
        "• Descargas el vídeo aquí.",
        "• Sin música.",
        "• Copia esta descripción, luego pégala.",
        "• Pulsa Publicar. Si falla, inténtalo otra vez enseguida, antes de cambiar de cuenta.",
        "• Muestra el vídeo en la cuadrícula."
      ),
    hardAfter: (account, count, reply) =>
      block(
        account,
        "Después de publicar.",
        "• Quédate 7 minutos en Para ti: mira, comenta y sigue cuentas.",
        "• Al menos 3 comentarios, 2 respuestas a comentarios, y varios seguidos.",
        "• Like solo lo que de verdad te guste, de creadores de tu país, no siempre los más conocidos, nunca varios seguidos.",
        reply ? "• Responde a los comentarios de la publicación de ayer." : undefined,
        `• Cierre obligatorio: muestra tu perfil con ${count} seguidos o más, bien legibles. No lo enseñes un segundo para pasar a la siguiente cuenta.`
      ),
    hardWarm: (account, count, reply) =>
      block(
        account,
        "Calentamiento, temporizador de 20 minutos. Hoy no publicas.",
        "• Muestra tu perfil al empezar.",
        "• Quédate 20 minutos de verdad en esta cuenta.",
        "• Ve a Para ti y mira cada vídeo de 5 a 10 segundos.",
        "• Like solo lo que de verdad te guste, de creadores de tu país, no siempre los más conocidos, nunca varios seguidos.",
        "• Al menos 3 comentarios, 2 respuestas a comentarios, y varios seguidos.",
        reply ? "• Responde a los comentarios de la publicación de ayer." : undefined,
        `• Cierre obligatorio: muestra tu perfil con ${count} seguidos o más, bien legibles. No lo enseñes un segundo para pasar a la siguiente cuenta.`
      ),
    hardProfileWarm: (account, count, reply) =>
      block(
        account,
        "Calentamiento de la cuenta nueva. Hoy no publicas.",
        "• Muestra tu perfil.",
        "• Ve a Para ti y mira cada vídeo de 5 a 10 segundos.",
        "• Like solo lo que de verdad te guste, de creadores de tu país, no siempre los más conocidos, nunca varios seguidos.",
        "• Al menos 3 comentarios, 2 respuestas a comentarios, y varios seguidos.",
        reply ? "• Responde a los comentarios de la publicación de ayer." : undefined,
        `• Cierre obligatorio: muestra tu perfil con ${count} seguidos o más, bien legibles. No lo enseñes un segundo para pasar a la siguiente cuenta.`
      ),
    sundayBefore: (account) =>
      block(
        account,
        "Calentamiento antes.",
        "• Ve a Para ti y mira cada vídeo de 5 a 10 segundos. No deslices cada 2 segundos.",
        "• Like solo lo que de verdad te guste, de creadores de tu país, no siempre los más conocidos, nunca varios seguidos.",
        "• Al menos 3 comentarios, 2 respuestas a comentarios, y varios seguidos."
      ),
    sundayAfter: (account, reply) =>
      block(
        account,
        "Después de publicar.",
        "• Quédate 7 minutos en Para ti: mira, comenta y sigue cuentas.",
        "• Al menos 3 comentarios, 2 respuestas a comentarios, y varios seguidos.",
        "• Like solo lo que de verdad te guste, de creadores de tu país, no siempre los más conocidos, nunca varios seguidos.",
        reply ? "• Responde a los comentarios de la publicación de ayer." : undefined
      ),
    bilan: block(
      "Balance de fin de semana",
      "En los últimos 5 minutos del vídeo de prueba.",
      "• Pasa por cada cuenta.",
      "• Muestra los resultados de vistas y el número de seguidos.",
      "• En cada cuenta, abre las analíticas del vídeo con más vistas.",
      "• Muestra el reparto hombre / mujer y los países objetivo."
    ),
    followTotal: (count) => `Tienes que tener ${count} seguidos o más en total en la cuenta.`,
    followTotalLong: (count) =>
      `Tienes que tener ${count} seguidos o más en total en la cuenta. Al final de la sesión de esta cuenta, muéstrame el perfil para comprobar que hay ${count} seguidos o más.`,
    focusGoal: (count) => `Objetivo: al menos ${count} seguidos al final, y mostrarle a TikTok que eres una persona real.`,
    focusNoPost: (account, count) =>
      block(
        account,
        "Focus objetivo.",
        `Objetivo: al menos ${count} seguidos al final, y mostrarle a TikTok que eres una persona real.`,
        "• Desliza como si fuera tu TikTok. Pasa un buen rato. Comenta y responde a comentarios que ya están ahí.",
        "• Entra en influencers que conoces, no muy conocidos, para que TikTok vea que eres del país.",
        "• No le des like a todo.",
        `• Sigue cuentas hasta tener al menos ${count} seguidos.`,
        "• Un like solo cuando de verdad te guste."
      ),
    profile: (account) => block(account, "Escribe una bio y pon una foto de perfil."),
    photoRule: block("La foto", "• Sale de Pinterest, o es una foto que ya tienes", "• Nada de imagen generada por IA"),
    photoMonday: block(
      "La foto",
      "• Un screen de una chica en Pinterest, o una foto que ya tienes",
      "• Nada de imagen generada por IA"
    ),
    bioTitle: "La bio",
    bioTuesday: "consejos de amistad 🫶 siempre con el juego verdad o verdad",
    bioRule: block("La bio", "• Natural, escrita por ti", "• No habla de las aplicaciones", "• Nada de texto generado por IA"),
    thenWarm: "Después.",
    noPostToday: "Hoy no publicas.",
    engageMore:
      "Hoy, suscríbete un poco más, dale like y comenta un poco más. Implícate un poco más en los vídeos. Puedes deslizar muchas si no te interesan.",
  },
  en: {
    create: (first, second, third) =>
      block(
        "Create 3 new TikTok accounts.",
        `One for ${first}, one for ${second}, and one for ${third}.`,
        "• Each one starts from zero",
        "• Do not use an account that is already open",
        "• An email or a phone number from your country",
        "• The account belongs to you",
        "• I will never take it for myself",
        "• You can delete the accounts without any problem",
        "• Do not record this part",
        "• There may be passwords"
      ),
    username: block(
      "Username",
      "• A common girl's name",
      "• From the country you post in",
      "• You choose it",
      "• Nothing related to my apps"
    ),
    noProfile: block("No photo and no bio", "• No profile photo and no bio", "• You only create the accounts"),
    warm: (account, before = "") =>
      block(
        account,
        before.trim(),
        "As if it were your TikTok.",
        "Have a good time.",
        "• Scroll, watch what you like",
        "• Do not like everything",
        "• A like, only when you really like it",
        "• You do not post anything"
      ),
    postWarmBefore: (account, goal) =>
      block(
        account,
        "Warm-up.",
        goal,
        "As if it were your TikTok.",
        "• Scroll, watch what you like",
        "• A like, only when you really like it"
      ),
    post: (account) =>
      block(
        account,
        "You post the day's slideshow.",
        "• It is on this page, you download it",
        "• Pick a song in TikTok",
        "• Tap Post",
        "• Wait until you see the video on the profile"
      ),
    postWarmAfter: (account) =>
      block(
        account,
        "Warm-up after.",
        "As if it were your TikTok.",
        "• Scroll, watch what you like",
        "• You do not post anymore"
      ),
    tuesdayWarmBefore: (account, goal, forYou) =>
      block(
        account,
        "Precise warm-up.",
        goal,
        "• Go to 5 influencer accounts from your country that you know. Follow them, watch their videos, and reply to comments that are already there.",
        forYou ?? "• Go back to For You. Scroll, follow, and comment on at least 5 videos."
      ),
    tuesdayForYou:
      "• Go back to For You. Scroll, act normally, and interact with the videos (likes, comments, follows) when it interests you and it is content from your country.",
    forYouWarmBefore: (account) =>
      block(
        account,
        "Precise warm-up.",
        "• Go to the For You page. Scroll, act normally, and interact with the videos (likes, comments, follows) when it interests you and it is content from your country."
      ),
    tuesdayPost: (account) =>
      block(
        account,
        "You post today's slideshow.",
        "• Download it here.",
        "• Pick a TikTok song of the moment, one you know and hear often.",
        "• Copy this caption.",
        "• Tap Post.",
        "• Wait until you see the video on the profile."
      ),
    tuesdayWarmAfter: (account) =>
      block(
        account,
        "Warm-up after.",
        "• Go back to For You.",
        "• Scroll, watch what interests you.",
        "• You do not post anymore.",
        "• Interact in a natural way."
      ),
    tuesdayClose: (account) =>
      block(
        account,
        "• Go back to For You.",
        "• Scroll, and watch what interests you.",
        "• You do not post anymore.",
        "• Interact in a natural way.",
        "• Follow accounts from your country when the content appeals to you."
      ),
    tuesdayStay: (account) =>
      block(
        account,
        "Stay on it, as if it were your TikTok.",
        "Have a good time.",
        "• Scroll, and watch what interests you.",
        "• A like only when you really like it.",
        "• Follow creators from your country when a video appeals to you, then show the profile.",
        "• You do not post anything."
      ),
    tuesdayFocus: (account) =>
      block(
        account,
        "• Scroll as if it were your TikTok. Have a good time. Comment, and reply to comments that are already there.",
        "• Go to influencers you know, not too well known, so TikTok sees that you are from the country.",
        "• You do not like everything.",
        "• A like only when you really like it."
      ),
    hardRules: block(
      "Rules",
      "• One video, no cuts, from start to finish.",
      "• Tick a task only if it shows in the video."
    ),
    hardBefore: (account) =>
      block(
        account,
        "Warm-up before.",
        "• Show your profile: the starting follow count has to be easy to read.",
        "• Go to For You and watch each video for 5 to 10 seconds. Do not swipe every 2 seconds.",
        "• Like only what you really like, from creators in your country, not the most famous ones all the time, never back to back.",
        "• At least 3 comments, 2 replies to comments, and several follows."
      ),
    hardPost: (account) =>
      block(
        account,
        "Post.",
        "• Get the slideshow and the caption ready before you record.",
        "• Download it here.",
        "• A trending TikTok sound.",
        "• Copy this caption, then paste it.",
        "• Tap Post. If it fails, try again right away, before you switch accounts.",
        "• Show the video in the grid."
      ),
    videoPost: (account) =>
      block(
        account,
        "Post.",
        "• Get the video and the caption ready before you record.",
        "• Download the video here.",
        "• No music.",
        "• Copy this caption, then paste it.",
        "• Tap Post. If it fails, try again right away, before you switch accounts.",
        "• Show the video in the grid."
      ),
    hardAfter: (account, count, reply) =>
      block(
        account,
        "After posting.",
        "• Stay on For You for 7 minutes: watch, comment, and follow.",
        "• At least 3 comments, 2 replies to comments, and several follows.",
        "• Like only what you really like, from creators in your country, not the most famous ones all the time, never back to back.",
        reply ? "• Reply to comments on yesterday's post." : undefined,
        `• Required ending: show your profile with ${count} follows or more, easy to read. Do not flash the profile and switch accounts.`
      ),
    hardWarm: (account, count, reply) =>
      block(
        account,
        "Warm-up, 20-minute timer. You do not post.",
        "• Show your profile at the start.",
        "• Stay on this account for a real 20 minutes.",
        "• Go to For You and watch each video for 5 to 10 seconds.",
        "• Like only what you really like, from creators in your country, not the most famous ones all the time, never back to back.",
        "• At least 3 comments, 2 replies to comments, and several follows.",
        reply ? "• Reply to comments on yesterday's post." : undefined,
        `• Required ending: show your profile with ${count} follows or more, easy to read. Do not flash the profile and switch accounts.`
      ),
    hardProfileWarm: (account, count, reply) =>
      block(
        account,
        "Warm-up for the new account. You do not post.",
        "• Show your profile.",
        "• Go to For You and watch each video for 5 to 10 seconds.",
        "• Like only what you really like, from creators in your country, not the most famous ones all the time, never back to back.",
        "• At least 3 comments, 2 replies to comments, and several follows.",
        reply ? "• Reply to comments on yesterday's post." : undefined,
        `• Required ending: show your profile with ${count} follows or more, easy to read. Do not flash the profile and switch accounts.`
      ),
    sundayBefore: (account) =>
      block(
        account,
        "Warm-up before.",
        "• Go to For You and watch each video for 5 to 10 seconds. Do not swipe every 2 seconds.",
        "• Like only what you really like, from creators in your country, not the most famous ones all the time, never back to back.",
        "• At least 3 comments, 2 replies to comments, and several follows."
      ),
    sundayAfter: (account, reply) =>
      block(
        account,
        "After posting.",
        "• Stay on For You for 7 minutes: watch, comment, and follow.",
        "• At least 3 comments, 2 replies to comments, and several follows.",
        "• Like only what you really like, from creators in your country, not the most famous ones all the time, never back to back.",
        reply ? "• Reply to comments on yesterday's post." : undefined
      ),
    bilan: block(
      "End-of-week review",
      "In the last 5 minutes of the proof video.",
      "• Go through each account.",
      "• Show the view results and the follow count.",
      "• On each account, open the analytics of the video with the most views.",
      "• Show the male / female split and the targeted countries."
    ),
    followTotal: (count) => `You need ${count} or more follows in total on the account.`,
    followTotalLong: (count) =>
      `You need ${count} or more follows in total on the account. At the end of this account's session, show me the profile to confirm there are ${count} or more follows.`,
    focusGoal: (count) =>
      `Goal: at least ${count} accounts you follow by the end, and show TikTok that you are a real person.`,
    focusNoPost: (account, count) =>
      block(
        account,
        "Focus: the goal.",
        `Goal: at least ${count} accounts you follow by the end, and show TikTok that you are a real person.`,
        "• Scroll as if it were your TikTok. Have a good time. Comment, and reply to comments that are already there.",
        "• Go to influencers you know, not too well known, so TikTok sees that you are from the country.",
        "• You do not like everything.",
        `• Keep following until you follow at least ${count} accounts.`,
        "• A like only when you really like it."
      ),
    profile: (account) => block(account, "Write a bio and add a profile photo."),
    photoRule: block("The photo", "• It comes from Pinterest, or it is a photo you already have", "• No AI-generated image"),
    photoMonday: block(
      "The photo",
      "• A screenshot of a girl on Pinterest, or a photo you already have",
      "• No AI-generated image"
    ),
    bioTitle: "The bio",
    bioTuesday: "bestie advice & friendship tips 🫶 always with the truth or truth game",
    bioRule: block("The bio", "• Natural, written by you", "• It does not mention the apps", "• No AI-generated text"),
    thenWarm: "Then.",
    noPostToday: "You do not post today.",
    engageMore:
      "Today, follow a bit more, like and comment a bit more. Engage a bit more with the videos. You can swipe through plenty if they don't interest you.",
  },
};

export const taskPhrases = (lang: PostingLang) => phrases[lang];

export const postingUi = (lang: PostingLang) =>
  ({
    fr: {
      switchProfile: "Changer de profil",
      range: (start: string, end: string) => `Du ${start} au ${end}.`,
      slots: "Tes heures",
      hoursVary: "N'hésite pas à varier tes heures, pour que TikTok ne pense pas que tu es un robot.",
      slotsVary: "Ne fais pas toujours la même heure. Varie, pour que l'algorithme comprenne que tu n'es pas un robot en automatique.",
      pickOne: "Aucune heure pour l'instant.",
      picked: (hour: string) => `Tu as choisi ${hour}.`,
      proof: "Preuve du jour",
      proofPlay: "Lire",
      proofClose: "Fermer",
      proofBody: "Enregistrement filmé de la session. Tu as juste à enregistrer ton écran pendant toute ton heure de travail.",
      proofScroll: "Enregistrement des 30 minutes où tu fais défiler. Tu ne filmes pas la création des comptes : il peut y avoir des mots de passe.",
      validateDay: "Valider la journée",
      dayDone: "Journée validée",
      ready: "Cases et preuve sont là.",
      missing: "Il manque des cases ou la preuve.",
      local: "Les heures et les cases restent dans ce navigateur. Les images du diaporama et la vidéo sont envoyées.",
      files: "Les fichiers de ce navigateur ne se sont pas ouverts.",
      proofSending: (percent: number) => `Envoi… ${percent} %`,
      proofFail: "La vidéo n'est pas partie. Laisse la page ouverte et réessaie.",
      proofTooBig: "Cette vidéo dépasse 10 Go.",
      imagesMissing: "Les images ne sont pas encore là.",
      downloadPreparing: "Préparation…",
      downloadFail: "Les images n'ont pas pu être téléchargées. Réessaie.",
      lateProofTitle: (day: string) => `Vidéo d'hier, ${day}`,
      lateProofBody: "Ce jour n'est plus affiché. Envoie la vidéo ici. Une heure, jusqu'à 10 Go. Laisse la page ouverte.",
      catchupTitle: "Vidéos à envoyer",
      catchupBody: "Vendredi et samedi sont passés. Envoie la vidéo de chaque jour. Une heure, jusqu'à 10 Go. Laisse la page ouverte.",
      catchupFriday: "Vidéo du vendredi 6 novembre",
      catchupSaturday: "Vidéo du samedi 7 novembre",
      opening: "Ouverture…",
      todayChip: "Aujourd'hui",
      noTasks: "Pas encore de tâches",
      noTasksBody: "Les tâches de ce jour arrivent bientôt. Tu peux déjà choisir ton heure.",
      proofUpload: "Envoyer la preuve",
      proofReplace: "Changer la preuve",
      progress: (done: number, total: number) => `${done}/${total}`,
      saveSynced: "Tout est enregistré.",
      savePending: "Enregistrement…",
      saveError: "Pas enregistré. Vérifie ta connexion.",
      saveRetry: "Réessayer",
      proofLoading: "Chargement de la vidéo…",
      proofError: "La vidéo ne se lit pas ici. Télécharge-la pour la regarder.",
      proofDownload: "Télécharger",
      proofDownloading: (percent: number) => `Téléchargement… ${percent} %`,
      proofDownloadFail: "Le téléchargement a échoué. Réessaie.",
    },
    es: {
      switchProfile: "Cambiar de perfil",
      range: (start: string, end: string) => `Del ${start} al ${end}.`,
      slots: "Tus horas",
      hoursVary: "No dudes en variar tus horas, para que TikTok no piense que eres un robot.",
      slotsVary: "No hagas siempre la misma hora. Varía, para que el algoritmo entienda que no eres un robot en automático.",
      pickOne: "Todavía no hay hora.",
      picked: (hour: string) => `Has elegido ${hour}.`,
      proof: "Prueba del día",
      proofPlay: "Ver",
      proofClose: "Cerrar",
      proofBody: "Grabación de la sesión. Solo tienes que grabar tu pantalla durante toda tu hora de trabajo.",
      proofScroll: "Grabación de los 30 minutos en los que deslizas. No grabes la creación de las cuentas: puede haber contraseñas.",
      validateDay: "Validar el día",
      dayDone: "Día validado",
      ready: "Las casillas y la prueba están.",
      missing: "Faltan casillas o la prueba.",
      local: "Los horarios y las casillas se quedan en este navegador. Las imágenes del carrusel y el vídeo se envían.",
      files: "No se han podido abrir los archivos de este navegador.",
      proofSending: (percent: number) => `Enviando… ${percent} %`,
      proofFail: "El vídeo no se ha enviado. Deja la página abierta y vuelve a intentarlo.",
      proofTooBig: "Este vídeo pasa de 10 GB.",
      imagesMissing: "Las imágenes todavía no están.",
      downloadPreparing: "Preparando…",
      downloadFail: "No se han podido descargar las imágenes. Vuelve a intentarlo.",
      lateProofTitle: (day: string) => `Vídeo de ayer, ${day}`,
      lateProofBody: "Ese día ya no sale en la página. Envía el vídeo aquí. Una hora, hasta 10 GB. Deja la página abierta.",
      catchupTitle: "Vídeos por enviar",
      catchupBody: "El viernes y el sábado ya pasaron. Envía el vídeo de cada día. Una hora, hasta 10 GB. Deja la página abierta.",
      catchupFriday: "Vídeo del viernes 6 de noviembre",
      catchupSaturday: "Vídeo del sábado 7 de noviembre",
      opening: "Abriendo…",
      todayChip: "Hoy",
      noTasks: "Todavía no hay tareas",
      noTasksBody: "Las tareas de este día llegan pronto. Ya puedes elegir tu hora.",
      proofUpload: "Enviar la prueba",
      proofReplace: "Cambiar la prueba",
      progress: (done: number, total: number) => `${done}/${total}`,
      saveSynced: "Todo está guardado.",
      savePending: "Guardando…",
      saveError: "No se ha guardado. Revisa tu conexión.",
      saveRetry: "Reintentar",
      proofLoading: "Cargando el vídeo…",
      proofError: "El vídeo no se reproduce aquí. Descárgalo para verlo.",
      proofDownload: "Descargar",
      proofDownloading: (percent: number) => `Descargando… ${percent} %`,
      proofDownloadFail: "La descarga ha fallado. Vuelve a intentarlo.",
    },
    en: {
      switchProfile: "Switch profile",
      range: (start: string, end: string) => `From ${start} to ${end}.`,
      slots: "Your hours",
      hoursVary: "Don't hesitate to vary your hours, so TikTok doesn't think you're a robot.",
      slotsVary: "Don't always pick the same hour. Switch it up, so the algorithm sees you're not a robot on autopilot.",
      pickOne: "No hour yet.",
      picked: (hour: string) => `You picked ${hour}.`,
      proof: "Proof of the day",
      proofPlay: "Play",
      proofClose: "Close",
      proofBody: "A recording of the session. Just screen-record your whole hour of work.",
      proofScroll: "A recording of the 30 minutes when you scroll. Do not record while you create the accounts: there may be passwords.",
      validateDay: "Validate the day",
      dayDone: "Day validated",
      ready: "The boxes and the proof are here.",
      missing: "Some boxes or the proof are missing.",
      local: "Time slots and boxes stay in this browser. The slideshow images and the video are sent.",
      files: "The files in this browser did not open.",
      proofSending: (percent: number) => `Sending… ${percent}%`,
      proofFail: "The video did not send. Keep this page open and try again.",
      proofTooBig: "This video is over 10 GB.",
      imagesMissing: "The images are not here yet.",
      downloadPreparing: "Preparing…",
      downloadFail: "The images could not be downloaded. Try again.",
      lateProofTitle: (day: string) => `Yesterday's video, ${day}`,
      lateProofBody: "That day is no longer on the page. Upload the video here. One hour, up to 10 GB. Keep this page open.",
      catchupTitle: "Videos to send",
      catchupBody: "Friday and Saturday have passed. Send the video for each day. One hour, up to 10 GB. Keep this page open.",
      catchupFriday: "Friday, November 6 video",
      catchupSaturday: "Saturday, November 7 video",
      opening: "Opening…",
      todayChip: "Today",
      noTasks: "No tasks yet",
      noTasksBody: "This day's tasks are coming soon. You can already pick your hour.",
      proofUpload: "Upload proof",
      proofReplace: "Replace proof",
      progress: (done: number, total: number) => `${done}/${total}`,
      saveSynced: "Everything is saved.",
      savePending: "Saving…",
      saveError: "Not saved. Check your connection.",
      saveRetry: "Try again",
      proofLoading: "Loading the video…",
      proofError: "The video won't play here. Download it to watch it.",
      proofDownload: "Download",
      proofDownloading: (percent: number) => `Downloading… ${percent}%`,
      proofDownloadFail: "The download failed. Try again.",
    },
  })[lang];

export const slideCopy = {
  fr: {
    button: "Télécharger toutes les images",
    note: "Tu fais le diaporama avec ces images.",
    download: "Télécharger les images",
    downloadLine: "Tu le télécharges ici.",
    videoDownload: "Télécharger la vidéo",
    videoDownloadLine: "Tu télécharges la vidéo ici.",
    videoWaiting: "La vidéo n'est pas encore là.",
    copy: "Copier",
    copyLine: "Copie cette description.",
    copied: "Copié.",
    noCaption: "Pas encore de description.",
  },
  es: {
    button: "Descargar todas las imágenes",
    note: "Haces el carrusel con estas imágenes.",
    download: "Descargar las imágenes",
    downloadLine: "Lo descargas aquí.",
    videoDownload: "Descargar el vídeo",
    videoDownloadLine: "Descargas el vídeo aquí.",
    videoWaiting: "El vídeo todavía no está.",
    copy: "Copiar",
    copyLine: "Copia esta descripción.",
    copied: "Copiado.",
    noCaption: "Todavía no hay descripción.",
  },
  en: {
    button: "Download all the images",
    note: "You make the slideshow with these images.",
    download: "Download the images",
    downloadLine: "Download it here.",
    videoDownload: "Download the video",
    videoDownloadLine: "Download the video here.",
    videoWaiting: "The video is not here yet.",
    copy: "Copy",
    copyLine: "Copy this caption.",
    copied: "Copied.",
    noCaption: "No caption yet.",
  },
};

/** Tania's desk is French only. */
export const adminCopy = {
  summaryTitle: "Qui a fait quoi",
  filterLabel: "Filtrer par fille",
  filterAll: "Toutes",
  summaryLegend: "Heure · tâches faites / total · 🎥 preuve envoyée, ∅ pas de preuve. Vert : journée validée.",
  summaryCell: (girl: string, day: string, hour: string | null, done: number, total: number, proof: boolean, validated: boolean) =>
    `${girl}, ${day} : ${hour ?? "pas d'heure"}, ${done} sur ${total} tâches, ${proof ? "preuve envoyée" : "pas de preuve"}${validated ? ", validée" : ""}`,
  slotsTitle: "Créneaux",
  noHour: "Pas d'heure",
  tasks: (done: number, total: number) => `${done}/${total} tâches`,
  validated: "Validée",
  notValidated: "Pas validée",
  noProof: "Pas encore de preuve.",
  dayValidated: (count: number, total: number) => `${count}/${total} validées`,
  noTasks: "Pas encore de tâches",
  today: "Aujourd'hui",
  dayBrief: "Consignes du jour",
  deleteDay: "Supprimer ce jour",
  deleteDayFail: "Le jour n'a pas été supprimé. Réessaie.",
  videoOnly: "Une vidéo, pas des photos. Pas de musique.",
  remove: "Retirer",
  removeFile: (name: string) => `Retirer ${name}`,
  captionPlaceholder: "Description du jour",
  captionLabel: (girl: string, account: string) => `Description de ${girl}, ${account}`,
  bilanTitle: "Bilan fin de semaine",
  bilanBody: "Dépose la vidéo de tuto. Elle s'affiche dans l'encart du dimanche, chez les filles.",
  bilanInput: "Vidéo de tuto du bilan fin de semaine",
  bilanTooBig: "Cette vidéo dépasse 1 Go.",
  bilanFail: "La vidéo n'a pas été enregistrée. Réessaie.",
  fileTooBig: "Ce fichier dépasse 25 Mo.",
  fileFail: "Le fichier n'a pas été enregistré sur le site. Réessaie.",
  removeFail: "L'image n'a pas été retirée.",
  captionFail: "La description n'a pas été enregistrée sur le site.",
  localSyncFail: "Les images déjà dans ce navigateur n'ont pas été envoyées au site.",
  profiles: "Profils",
  newProfile: "Nouveau profil",
  namePlaceholder: "Nom",
  codePlaceholder: "Code",
  add: "Ajouter",
  save: "Enregistrer",
  delete: "Supprimer",
  nameOf: (name: string) => `Nom de ${name}`,
  codeOf: (name: string) => `Code de ${name}`,
};

/** Only Karol sees this box, so it is English. */
export const sundayCatchupCopy = {
  title: "Sunday, November 15",
  body: "This day is no longer on the page. Upload the proof video here. It includes the end-of-week review. One hour, up to 10 GB. Keep this page open.",
  input: "Sunday, November 15 proof video",
};
