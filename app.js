const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"))

app.set("view engine", "ejs");

mongoose.connect("mongodb+srv://hardikj2003:hardik1234@cluster0.bj0mh0f.mongodb.net/todolistDB", {useNewUrlParser: true})

const itemsSchema = {
    name: String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your ToDoList!"
})
const item2 = new Item({
    name: "Hit the + button to add a new Item. "
})
const item3 = new Item({
    name: "<-- Hit this to delete the item"
})

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)

async function getItems(){

    const Items = await Item.find({});
    return Items;
  
}

app.get("/", (req,res)=>{
    getItems().then(function(foundItems){
        if(foundItems.length === 0){
            Item.insertMany(defaultItems)
            .then(function() {
                console.log("Successfully saved defult items to DB");
            })
            .catch(function (err) {
                console.log(err);
            }); 
            res.redirect("/");
        }else{
            res.render("list", {listTitle: 'Today', newListItems: foundItems});
        }
    });
})

app.get("/:customListName", (req,res)=>{
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName})
    .then((foundList)=> {
        if(!foundList){
            // create a new list
            const list = new List({
                name: customListName,
                items: defaultItems
            })
            list.save();
            res.redirect("/"+ customListName)
        }else{
            // show an existing list
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items});

        }
    })

    
    
});

app.post("/", (req,res)=>{
    var itemName = req.body.newItem;
    var listName = req.body.list;

    const item = new Item({
        name: itemName
    })

    if(listName === "Today"){
        item.save();
        res.redirect("/")
    }else{
        List.findOne({name: listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+ listName);
        })
    }

})

app.post("/delete", (req,res)=>{
    const checkedItemID = req.body.checkbox
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemID)
        .then(function () {
            console.log("Succesfully deleted checked Item");
            res.redirect("/")
        })
        .catch(function (err) {
            console.log(err);
        });
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}).then(function(foundList){
            res.redirect("/" + listName)
        })
    }

})

app.get("/work",(req,res)=>{
    res.render("list", {listTitle: "Work List", newListItems: workItems })
})

app.listen(3000, ()=>{
    console.log("server running at 3000");
})
