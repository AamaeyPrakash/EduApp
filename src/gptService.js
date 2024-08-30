import axios from "axios";
import { OPENAI_API_KEY } from "../constants";
import OpenAI from "openai";

// const API_URL = 


const generateGPTQuestion = async(topic) =>{
  
    const prompt =` Generate an easy question ${topic} for math problems`
    try{
        const response = await  axios.post(
            'https://api.openai.com/v1/completions',
            {
              model:"gpt-3.5-turbo",
              prompt:prompt,
              max_token:100,
        },
        {
            headers:{
                "Content-Type":'application/json',
                "Authorization": `Bearer ${OPENAI_API_KEY}`

            },
        }
        
      );
    return response.data;
    }
    catch(error){
      console.error(error);
      return"Wrong";
    }

};
export default generateGPTQuestion