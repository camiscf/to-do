import { Form, useLoaderData } from '@remix-run/react';
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
const { currentUser, error } = useLoaderData();

return (
    <div>
    {error ? <div className="error">{error}</div> : null}
    <Form method="POST" >
        <div>
        <p>Please sign in</p>
        </div>
        <label>
        Username: <input type="text" name="username" required />
        </label>
        <label>
        Password:{" "}
        <input type="password" name="password" required />
        </label>
        <button type="submit">Fazer Login</button>
    </Form>
    </div>
);
}
