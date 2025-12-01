import {io} from "socket.io-client";


const URL = "http://localhost:3000";


export const socket = io(URL,

    {
        transport: ["websocket"],
        extraHeaders: {

            Authorization: "Bearer " + localStorage.getItem("token"),

        },

    }
);

socket.on("connect", () => {

    console.log('connected');

});

socket.on("disconnect", () => {

    console.log('disconnected');

});
