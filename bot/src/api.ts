import fastify, {FastifyReply, FastifyRequest} from "fastify";

export async function startServer(){
    const app = fastify({ logger: true, trustProxy: true });


    // @ts-ignore
    app.post("/forgetPassword", forgetPasswordEndpoint);


    await app.listen({ port: 3000 })
}

export async function forgetPasswordEndpoint(req: FastifyRequest, res: FastifyReply) {

}
