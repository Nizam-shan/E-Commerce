var db = require('../config/connection')
var collection=require('../config/collections')
const { response } = require('../app')
var objectId= require('mongodb').ObjectId
module.exports={

    addProduct:(product,callback)=>{
        


         db.get().collection('product').insertOne(product).then((data)=>{
             
             callback(data.insertedId)
             
         })
       
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)

        })

    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId (proId)}).then((response)=>{
              // console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
        
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
                $set:{
                    Name:proDetails.Name,
                    Discription:proDetails.Discription,
                    Price:proDetails.Price,
                    Category:proDetails.Category
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    // doLogin:(adminData)=>{
    //     return new Promise(async(resolve,reject)=>{
    //         let loginStatus=false
    //         let response={}
    //         let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.Email})
    //         if(admin){
    //             bcrypt.compare(adminData.Password,admin.Password).then((status)=>{
    //                 if(status){
    //                     console.log("success");
    //                     response.user=admin
    //                     response.status=true
    //                     resolve(response)
    //                 }else{
    //                     console.log("fail");
    //                     resolve({status:false})
    //                 }
    //             })

    //        }else{
    //             console.log("login failed")
    //             resolve({status:false})
    //         }
           
    //     })
    // },
    getAllOrders:(orderId,orders)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).find({orderId})
            console.log(orderId)
            resolve(orders)
           //let orders=await db.get().collection(collection.ORDER_COLLECTION).find(orderId).toArray()
           // console.log(orders);
           // resolve(orders)
          
        })
    },
}