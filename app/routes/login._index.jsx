import { Form, Link, useLoaderData } from '@remix-run/react';
import { json, redirect } from "@remix-run/node"; // or cloudflare/deno
import * as fs from 'fs';
import { getSession, commitSession } from "../sessions";
  
export async function loader({ request }) {
    const session = await getSession(
        request.headers.get("Cookie")
    );

    const data = { error: session.get("error") };

    return json(data, {
        // salvar na sessão
        headers: {
        "Set-Cookie": await commitSession(session),
        },
    });
}

export async function action({ request }) {
    const session = await getSession(
        request.headers.get("Cookie")
    );

    const form = await request.formData();
    const username = form.get("username");
    const password = form.get("password");
    const userId = validateCredentials(username, password);

    function readDatabase() {
        const data = fs.readFileSync('database.json');
        return JSON.parse(data);
    }

    function validateCredentials(username, password){
        const database = readDatabase();

        if (database) {
            const user = Object.entries(database).find(([userId, user]) => user.username === username)[1];

            if (user) {
                if (user.password === password) {
                    // Senha correta
                    return user.id;
                } else {
                    // Senha incorreta
                }
            } else {
                // Erro: Usuário não encontrado
            }
        }

        return null;
    }

    if (userId == null) {
        session.flash("error", "Invalid username/password");

        return redirect("/login", {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
        });
    }

    session.set("userId", userId);

    return redirect("/?index", {
        headers: {
        "Set-Cookie": await commitSession(session),
        },
    });
}

export default function Login() {
const { error } = useLoaderData();

return (
    <div className='font-roboto m-0 tx-[#101935]'>
        {error ? <div className="error">{error}</div> : null}
        <Form method="POST"  className='flex flex-col justify-center'>
            <div>
                <h1 className='text-5xl font-bold translatemt-5 ml-[38%] my-10'>Faça o seu login</h1>
            </div>
            <div className='flex flex-col bg-[#8B8BAE] w-1/3 h-96 rounded-xl align-center mx-[35%]'>
                <label className='text-2xl flex flex-col ml-[15%] mt-[10%]'>
                    Usuário: <input autocomplete="off" className='rounded bg-[#7B7BA3] mt-2 w-[80%] py-1 px-1 text-base font-bold focus:outline-none hover:cursor-pointer ' type="text" name="username" required />
                </label>
                <label className='text-2xl flex flex-col ml-[15%] mt-[5%]'>
                    Senha:{" "} <input autocomplete="off" className='rounded bg-[#7B7BA3] mt-2 w-[80%] py-1 px-1 text-base font-bold focus:outline-none hover:cursor-pointer ' type="password" name="password" required />
                </label>
                <button className='text-base bg-[#626282] hover:bg-[#272f49] rounded w-32 h-10 px-5 py-2 flex flex-col ml-[35%] mt-[5%]' type="submit">Fazer Login</button>
                <div>
                    <Link to='/register' className='text-base bg-[#626282] hover:bg-[#272f49] rounded w-32 h-10 px-5 py-2 flex flex-col ml-[35%] mt-[5%]' >Cadastre-se</Link>
                </div>  
            </div>
        </Form>
    </div>
);
}
