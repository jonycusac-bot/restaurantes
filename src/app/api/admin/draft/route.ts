import { handleDraftRequest } from "../../../../lib/admin-draft-api";
import { inchDatabase, postgresDraftStore } from "../../../../lib/inch-database";
const handle = (request: Request) => handleDraftRequest(request, () => postgresDraftStore(inchDatabase()));
export const GET = handle;
export const PUT = handle;
