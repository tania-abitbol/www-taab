import { CreatorsLanding } from "~/components/creators/CreatorsLanding";
import { creatorMetadata } from "~/components/creators/creatorMetadata";
import { creatorPrograms } from "~/config/creatorProgram";

const program = creatorPrograms.fr;

export const metadata = creatorMetadata(program);

export default function CreateursPage() {
  return <CreatorsLanding content={program} />;
}
