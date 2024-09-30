import axios from "axios";
import { OPENAI_API_KEY } from "../constants";
import OpenAI from "openai";

// const API_URL = 


const checkAnswer = async(question,answer,topic) =>{
  
    const messages= [
    {
      role:"user",
      content:`You are an expert in math and give answers with easy explanation Question:${question} Answer:${answer}.Is this correct?If not generate the right answer`
    },
    ];
    try{
        const response = await  axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model:"gpt-3.5-turbo-0125",
              messages:messages,
              max_tokens:100,
        },
        {
            headers:{
                "Content-Type":'application/json',
                "Authorization": `Bearer ${OPENAI_API_KEY}`

            },
        }
        
      );
      console.log(response.data)
    return response.data;
    }
    catch(error){
      console.error(error);
      console.log(error)
      return "Wrong";
    }

};
export default checkAnswer