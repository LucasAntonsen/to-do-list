//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();

let mongoUser = process.env.MONGO_USER;
let mongoPass = process.env.MONGO_PASS;
let mongoDatabase = process.env.MONGO_DATABASE;

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb+srv://" + mongoUser + ":" + mongoPass + mongoDatabase);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todoList!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {

  Item.find({}, (err, foundItems) => {

    if(foundItems.length === 0){
      Item.insertMany(defaultItems, (err) => {
        if(err){
          console.log(err);
        }else{
          console.log("Successfully saved default items to DB.");
        }
        res.redirect("/");
      });

    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.post("/", (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save( (err, result) => {
      res.redirect("/");
    });

  }else{
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save( (err, result) => {
        res.redirect("/" + listName);
      });
    });
  }

});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if(!err){
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

});

app.get("/:customListName", (req,res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, foundList) => {
    if(!err){
      if(!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save( (err, result) => {
          res.redirect("/" + customListName);
        });

      }else{
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });

});

app.get("/about", (req, res) => {
  res.render("about");
});

//Connect to the database before listening
connectDB().then(() => {
  let port = process.env.PORT;
  if(port == null || port == ""){
    port = 3000;
  }

  app.listen(port, () => {
    console.log("Server has started successfully");
  });
});
