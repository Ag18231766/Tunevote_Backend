import { Prisma, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default async function NextStrema(creatorId:string){
    const mostUpvotedStream = await prisma.stream.findFirst({
        where:{
            userId:creatorId as string,
            played:false
        },
        orderBy:{
            upvotes:{
                _count:'desc'
            }
        }
        
    })
    console.log(mostUpvotedStream);
    if(!mostUpvotedStream){
        return {message:" no stream exists"}
    }

    await Promise.all([prisma.currentStream.upsert({
        where:{
            userId: creatorId as string
        },
        update:{
            userId: creatorId as string,
            streamId:mostUpvotedStream?.id 
        },
        create:{
            userId: creatorId as string,
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
    return {mostUpvotedStream:mostUpvotedStream}
}