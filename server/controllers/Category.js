const Category = require("../models/Category");

function getRandomInt(max){
    return Math.floor(max*Math.random());
}

//create category handler
module.exports = async (req,res)=>{
    try{
        const {name, description} = req.body;

        //validation
        if(!name||!description){
            return res.status(401).json({
                success:false,
                message:'all fields are required'
            }) 
        }

        const categoryDetails = await Category.create({
            name,
            description
        })

        console.log(CategorysDetails)
        return res.status(200).json({
            success: true,
            message: "Categorys Created Successfully",
        })

    }catch(error){
        return res.status(500).json({
            success: true,
            message: error.message,
        })
    }
}

//get all categories handler
exports.showAllCategories = async(req,res)=>{
    try{
        const allCategories = await Category.find()
        res.status(200).json({
          success: true,
          data: allCategories,
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

//category page details handler
exports.categoryPageDetails = async (req,res)=>{
    try{
        const {categoryId} = req.body;

        //get courses for the specified categories
        const selectedCategory = await Category.findById(categoryId)
         .populate({
            path:"courses",
            match:{status:"Published"},
            populate:"ratingAndReviews"
         })
         .exec();

        console.log("SELECTED COURSE", selectedCategory)

        // Handle the case when the category is not found
        if(!selectedCategory) {
           console.log("Category not found.")
           return res
             .status(404)
             .json({ success: false, message: "Category not found" })
        }

        // Handle the case when there are no courses
        if(selectedCategory.courses.length === 0) {
            console.log("No courses found for the selected category.")
            return res.status(404).json({
            success: false,
            message: "No courses found for the selected category.",
            })
        }

        //get the courses for other categories
        const categoriesExceptSelected = await Category.find({_id:{$ne:categoryId}});

        let differentCategory = await Category.findOne(
            categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id
        )
        .populate({
            path:"courses",
            match: { status: "Published" },
        })
        .exec();

        // Get top-selling courses across all categories
        const allCategories = await Category.find()
        .populate({
            path: "courses",
            match: { status: "Published" },
        })
        .exec();

        const allCourses = allCategories.flatMap((category)=>category.courses);
        const mostSellingCourses = allCourses.sort((a,b)=>b.sold-a.sold).slice(0,10);

        res.status(200).json({
            success: true,
            data: {
              selectedCategory,
              differentCategory,
              mostSellingCourses,
            },
        })

      
    }catch(error){
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        })
    }
}