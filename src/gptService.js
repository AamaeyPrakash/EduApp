// import axios from "axios";
// import { OPENAI_API_KEY } from "../constants";
// import OpenAI from "openai";

// // const API_URL = 


// const generateGPTQuestion = async(topic,grade) =>{
//     const prompt =` Generate an easy question ${topic} for math problems for grade {} `
//     try{
//         const response = await 'https://api.openai.com/v1/completions'{
//             model:"gpt-3.5-turbo-0125",
//             prompt:prompt,
//             max_token:100,


//         },
//         {
//             headers:{
//                 "Content-Type":'application/json',
//                 "Authorization": `Bearer ${OPENAI_API_KEY}`

//             }
//         }
        
//     };

// }
import React from 'react'

function gptService() {
  return (
    <div>gptService</div>
  )
}

export default gptService