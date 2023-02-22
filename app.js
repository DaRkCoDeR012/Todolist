//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
  name: "String"
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listschema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listschema);

app.get("/", function(req, res) {

  Item.find({},function(err, founditems){
    if(founditems.length === 0){
      Item.insertMany(defaultItems, function(err){});
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: founditems}); 
    }
    
  })

});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName},function(err,foundlist){
    if(!err){
      if(!foundlist){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save(); 
        res.redirect("/" + customListName);
      }
      else{
        res.render("list", {listTitle: foundlist.name, newListItems: foundlist.items});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listname = req.body.list;

  const newitem = new Item({
    name: itemName
  });

  if(listname === "Today"){
    newitem.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listname}, function(err, foundlist){
      foundlist.items.push(newitem);
      foundlist.save();
      res.redirect("/"+listname);
    });
  }
});

app.post("/delete", function(req,res){
  const checkeditemid = req.body.checkbox;
  const listname = req.body.listname;

  if(listname == "Today"){
    Item.deleteOne({_id: checkeditemid},function(err){
      if(!err){
        res.redirect("/");
      }
    });
  } else{
    List.findOneAndUpdate({name: listname},{$pull: {items: {_id: checkeditemid}}},function(err, foundlist){
      if(!err){
        res.redirect("/"+listname);
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});