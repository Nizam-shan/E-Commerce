var db = require('../config/connection')
var collection=require('../config/collections')
const bcrypt = require('bcrypt')
const { render, response } = require('../app');
const { ObjectID } = require('bson');
const async = require('hbs/lib/async');
const { reject } = require('bcrypt/promises');
const Razorpay=require('razorpay');
const { LEGAL_TCP_SOCKET_OPTIONS } = require('mongodb');
//const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')
var objectId= require('mongodb').ObjectId
var instance = new Razorpay({
    key_id:'rzp_test_V8DyO2a3aeMxE4',
    key_secret:'Oe3Oo9poXG4ExGqA2DFsqNeC',
});



module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
        userData.Password=await bcrypt.hash(userData.Password,10)
        
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                
                resolve(data.insertedId)

            })
            
        })
        

    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log("success");
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log("fail");
                        resolve({status:false})
                    }
                })

            }else{
                console.log("login failed")
                resolve({status:false})
            }
           
        })
    },
    addToCart:(proId,userID)=>{
        let proObj={
            item:objectId(proId),
            quantity :1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userID)})
            if(userCart){
                let proExist =userCart.products.findIndex(product =>product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userID),'products.item':objectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })

                }else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userID)},
                {
                    
                        $push:{products:proObj}
                    

                }
            ).then((response)=>{
                resolve()
            })
        }
                
                
            }else{
                let cartObj={
                    user:objectId(userID),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
               
            }
        })
    },
    getCartProducts:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await  db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userID)}
                },
                {
                    $unwind :'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
              
               // {
            //     $lookup:{
            //         from:collection.PRODUCT_COLLECTION,
            //         let :{prodList:'$products'},
            //         pipeline:[
            //             {
            //                 $match:{
            //                     $expr:{
            //                         $in:['$_id',"$$prodList"]
            //                     }
            //                 }
            //             }

            //         ],
            //         as:'cartItems'
            //     }
            // }
            ]) .toArray()
           
            resolve(cartItems)
            
        })
    },
    getCartCount:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let count = 0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userID)})
            if(cart){
                count=cart.products.length

            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
       details.count=parseInt(details.count)
       details.quantity=parseInt(details.quantity)

       // console.log(cartId,proId);
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
        
            {
                $inc:{'products.$.quantity':details.count}
            }
            ).then((response)=>{
                resolve({status:true})
            })
        }
            
        })
    
    },
    getTotalAmount:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let total=await  db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userID)}
                },
                {
                    $unwind :'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id' ,
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity',{$toInt:'$product.Price'}]}}
                    }
                }
            ]) .toArray()
            console.log(total[0].total);
           
            resolve(total[0].total)
            
        })

    },
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,products,total);
            let status=order['payment-method'] ==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode  
                },
                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                Date :new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                console.log("order id:",response.insertedId);
                
                resolve(response.insertedId)
            })

        })

    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            console.log(cart);
            resolve(cart.products)
        })
    },
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(userId)
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
            console.log(orders);
            resolve(orders)
        })
    },
    generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
           var options ={
            amount :total*100,
            currency:"INR",
            receipt:""+orderId
           };
           instance.orders.create(options, function(err,order){
            if(err){
                console.log(err);
            }else{
            console.log("new order:",order);
            resolve(order)
            }
           });
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256','Oe3Oo9poXG4ExGqA2DFsqNeC')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
            
            ).then(()=>{
                resolve()
            })
        })
    }
}

