import express from "express";
import cors from 'cors';
import z, { string } from 'zod';
import { PrismaClient } from "@prisma/client";
import { verifyJwt } from "../middlewares";
import { ExpressJwtRequest, Request } from "express-jwt";
//  @ts-ignore
import youtubesearchapi from 'youtube-search-api';
 

const StreamRouter = express.Router();
const prisma = new PrismaClient();
const YT_REGEX = new RegExp(/^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/);





// Middleware
StreamRouter.use(express.json());
StreamRouter.use(cors());




const CreateStreamSchema = z.object({
    creatorId:z.string(),
    url:z.string()
})
    
interface ytDetails {
    title:string,
    thumbnail:{
        thumbnails:{
            url:string,
            height:number,
            width:number
        }[]
    }
}

StreamRouter.post('/',verifyJwt,async (req:Request,res) => {
   
    try{
        const data = CreateStreamSchema.parse(req.body);
        const isYtUrl = data.url.match(YT_REGEX);
        if(!isYtUrl){
            return res.status(411).json("not valid youtube url");
        }
        const extractedId = data.url.split("?v=")[1];
        const {title,thumbnail}:ytDetails = await youtubesearchapi.GetVideoDetails(extractedId);
        const thumbnails = thumbnail.thumbnails;
        thumbnails.sort((a:{width:number},b:{width:number}) => a.width < b.width ? -1 : 1);
        const stream = await prisma.stream.create({
            data:{
                userId:data.creatorId,
                url:data.url,
                extractedId,
                type:"Youtube",
                title: title ?? "can't find video",
                smallImg:(thumbnails.length > 1 ? thumbnails[thumbnails.length - 2].url : thumbnails[thumbnails.length - 1].url ?? thumbnails[0].url ?? "https://www.google.com/url?sa=i&url=https%3A%2F%2Fstock.adobe.com%2Fsearch%3Fk%3Dfunny&psig=AOvVaw2n432g62Qe8XGVm-fHl5hR&ust=1725613615787000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCPD7kOy5q4gDFQAAAAAdAAAAABAE"),
                bigImg:thumbnails[thumbnails.length - 1].url
            }
        });
        res.status(200).json({
            ...stream,
            hasUpvoted:false,
            upvotes:0
        })
    }catch(e){
        console.log(e);
        return res.status(411).json({message:"Error while streaming"});
    }
})


const UpVoteSchema = z.object({
    streamId:z.string()
})

StreamRouter.post('/upvote',verifyJwt,async (req:Request,res) => {
    const id = req.auth?.sub?.split('|')[1];
    const user = await prisma.user.findFirst({
        where:{
            id:id
        }
    })
    if(!user){
        return res.status(403).json({
            message :"Unauthenticated"
        })
    }
    try{
        const data = UpVoteSchema.parse(req.body);
        await prisma.upvote.create({
            data:{
                userId:id ?? "",
                streamId:data.streamId ?? ""
            }
        })
        res.json({
            message : "upvote created"
        })
        
    }catch(e){
        return res.status(411).json("Error while streaming");
    }
})

StreamRouter.post('/downvote',verifyJwt,async (req:Request,res) => {
    const id = req.auth?.sub?.split('|')[1] as string;
    const user = await prisma.user.findFirst({
        where:{
            id:id
        }
    })
    if(!user){
        return res.status(403).json({
            message :"Unauthenticated"
        })
    }
    try{
        const data = UpVoteSchema.parse(req.body);
        await prisma.upvote.delete({
            where:{
                userId_streamId:{
                    userId:id,
                    streamId:data.streamId
                }
            }
        })
        res.json({
            message : "done"
        })
        
    }catch(e){
        return res.status(411).json("Error while streaming");
    }
})


StreamRouter.get('/',verifyJwt,async (req:Request,res) => {
    const creatorId = req.query.creatorId;
    const userId = req.query.userId;
    if(!creatorId){
        return res.json({message : "wrong createrId"})
    }
    const user = await prisma.user.findFirst({
        where:{
            id:creatorId as string
        }
    })
    if(!user){
        return res.status(403).json({
            message :"Unauthenticated"
        })
    }
    try{
        const [streams,activeStream] = await Promise.all([await prisma.stream.findMany({
            where:{
                userId:user.id as string,
                played:false
            },
            include:{
                _count:{
                    select:{
                        upvotes:true
                    }
                },
                upvotes:{
                    where:{
                        userId : userId as string
                    }
                }
            }
        }),prisma.currentStream.findFirst({
            where:{
                userId:creatorId as string,
                stream:{
                    played:false
                }
            },
            include:{
                stream:true
            }
        })])
        const isCreator = user.id === creatorId;
        res.json({
            streams:streams.map(({_count,...rest}) => ({
                ...rest,
                upvotes:_count.upvotes,
                haveUpvoted:rest.upvotes.length ? true : false
            })),
            activeStream,
            isCreator,
            creatorId
        })

    }catch(e){
        return res.status(411).json("Error while fetching");
    }
    
})

StreamRouter.get('/next',async (req,res) => {
    const creatorId = req.query.creatorId;
    if(!creatorId){
        return res.json({
            message : "Invalid creator"
        })
    }
    const creator = await prisma.user.findFirst({
        where:{
            id:creatorId as string
        }
    })
    if(!creator){
        return res.json({
            message : "Creator doesn't exist"
        })
    }

    try{
        const mostUpvotedStream = await prisma.stream.findFirst({
            where:{
                userId:creator.id as string,
                played:false
            },
            orderBy:{
                upvotes:{
                    _count:'desc'
                }
            }
            
        })
       
        if(!mostUpvotedStream){
            return res.json({
                message : "currently no stream exists"
            })
        }
        console.log(mostUpvotedStream);

    
        await Promise.all([prisma.currentStream.upsert({
            where:{
                userId:creator.id
            },
            update:{
                userId:creator.id,
                streamId:mostUpvotedStream?.id 
            },
            create:{
                userId:creator.id,
                streamId:mostUpvotedStream?.id 
            }
        }),prisma.stream.update({
            where:{
                id:mostUpvotedStream.id,
            },
            data:{
                played:true,
                playedTs:new Date()
            }
        })])
        console.log('hi there');
    
        return res.json({
            mostUpvotedStream:mostUpvotedStream
        })

    }catch(e){
        return res.status(411).json("Error while fetching");
    }
})

StreamRouter.get('/',verifyJwt, async (req,res) => {
    const createrId = req.query.createrId;
    try{
        const stream = await prisma.stream.findMany({
            where:{
                userId:createrId as string
            }
        })
        res.json({
            stream:stream
        })

    }catch(e){
        return res.status(411).json("Error while fetching");
    }
})









export default StreamRouter;








