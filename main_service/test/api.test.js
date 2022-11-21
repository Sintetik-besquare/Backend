const request = require("supertest");

let server;

beforeAll(() => {
    server = require('../index');
});

afterAll(async () => {
    await server.close();
});

describe("/user", ()=>{
    it("POST: Returns successfully signup",async() => {
        const response = await request(server).post("/user/signup").send({
            "email": "kai.ling11@besquare.com.my",
            "password": "Abcd1234!@"
        });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: "Successfully signup!" });
        //expect(response.body).toHaveProperty("token");
        
    })
}
);


// ========== Helper functions ==========
async function testList() {
    const response = await request(server).get('/users');
    // console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(Object.keys(users));
}

function expectError(response, errorCode, httpCode = 400) {
    expect(response.status).toBe(httpCode);
    expect(response.body).toEqual({ error: errorCode });
}