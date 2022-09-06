var express = require('express');
const { render } = require('../app');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();



/* GET users listing. */
router.get('/', function(req, res, next) {
 
  productHelpers.getAllProducts().then((products)=>{
    console.log(products);

    res.render('admin/view-products',{products ,admin:true})
  })
 
  
});
router.get('/add-product',function(req,res){
  res.render('admin/add-product')
})
router.post('/add-product',(req,res)=>{
   

   productHelpers.addProduct(req.body,(insertedId)=>{
    let image=req.files.Image
    console.log(insertedId);
    image.mv('./public/product-images/'+insertedId+'.jpg',(err,done)=>{
      if(!err){
        res.render("admin/add-product")
      }else{
        console.log(err);
      }
    })
    
   })
 })
 router.get('/delete-product/:id',(req,res)=>{
    let proId=req.params.id
    console.log(proId);
    productHelpers.deleteProduct(proId).then((response)=>{
      res.redirect('/admin/')
    })
 })
 router.get('/edit-product/:id',async (req,res)=>{
  let product= await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{product})
 })
 router.post('/edit-product/:id',(req,res)=>{
  console.log(req.params.id)
  let insertedId=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image =req.files.Image
      image.mv('./public/product-images/'+insertedId+'.jpg')
    }
  })
 })

//  router.get('/login',(req,res)=>{
//   if(req.session.admin){
//     res.redirect('/admin')
//   }else{
//   res.render('admin/login',{"loginErr":req.session.adminloginErr})
//   req.session.adminloginErr=null
//   }
// })


//  router.post('/login',(req,res)=>{
//   productHelpers.doLogin(req.body).then((response)=>{
//     if(response.status){
      
//       req.session.admin=response.admin
//       req.session.adminloggedIn = true
//       res.redirect('/admin')

//     }else{
//       req.session.adminloginErr = true
//       res.redirect('/login')
//     }
//   })

  
// })
router.get('/All-orders',async(req,res)=>{
  let orders=await productHelpers.getAllOrders(req.session.user)
  res.render('admin/All-orders',{orders,admin:true})
  
})


module.exports = router;
