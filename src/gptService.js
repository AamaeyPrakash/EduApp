import axios from "axios";
import { OPENAI_API_KEY } from "../constants";
import OpenAI from "openai";

// const API_URL = 


const generateGPTQuestion = async(topic) =>{
  
    // const prompt =` Generate an easy question ${topic} for math problems`
    const messages= [
    {
      role:"user",
      content:`${topic}. Consider that I am a IB Mathematics student when generating questions.`
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
export default generateGPTQuestion