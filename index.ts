import { neon } from "@neondatabase/serverless"

interface Item {
    co2: number
}

const MINUTES_IN_24H = 1440;
const sql = neon(process.env.DATABASE_URL || '');

async function addItem(item: Item) {
    try {
        await sql`
            INSERT INTO data (value)
            VALUES (${item.co2})
        `;

        return new Response("OK");
    } catch (e) {
        console.log("Erorr adding new item:", e)
        return new Response("ERROR", {
            status: 500
        });
    }
}

async function getItems() {
    return Response.json(await sql`SELECT * FROM data LIMIT ${MINUTES_IN_24H} ORDER BY date DESC`);
}

async function handlePOSTRequests(req: Request) {
    const url = new URL(req.url)

    switch(url.pathname) {
        case '/': {
            return await addItem(await req.json());            
        }

        default: {
            return new Response(`POST 404 - ${url.pathname}`, {
                status: 404
            });
        }
    }
}

function handleGETRequests(req: Request) {
    const url = new URL(req.url)
    
    switch(url.pathname) {
        case '/': {
            return getItems()
        }

        default: {
            return new Response(`GET 404 - ${url.pathname}`, {
                status: 404
            });
        }
    }
    
}

Bun.serve({
    fetch(req) {
        const url = new URL(req.url)
        if (!url.searchParams.has('token') || url.searchParams.get('token') !== process.env.TOKEN) {
            return new Response(`503 - Bye bye`, {
                status: 503
            });
        }

        switch(req.method) {
            case "POST": {
                return handlePOSTRequests(req)
            }

            case "GET": {
                return handleGETRequests(req)
            }

            default: {
                return new Response(`METHOD 400 - ${req.method}`, {
                    status: 400
                });
            }
        }
    },
  });
