
var Swiper = require('swiper');


module.exports = flexforever; 

var uSwipeID = 0;


function flexforever(divValue, reqOptions)
{
	console.log(divValue);

	var self = this;

	if(!reqOptions || !reqOptions.objectSize || !reqOptions.objectSize.width || !reqOptions.objectSize.height)
		throw new Error("Can't use flexforever without options or objectSize");

	//we have the div object -- now we need to inject our swiper object

	//add appropriate classes to our given div
	self.uid = "s" + uSwipeID++;

	self.objectSize = reqOptions.objectSize;

	var swipeBase = self.uid + "-swiper-#@#";
	var swipeConID = swipeBase.replace(/#@#/g, "container");
	var swipeWrapID = swipeBase.replace(/#@#/g, "wrapper");
	
	//console check!
	console.log('Base: ', swipeBase, " contain: ", swipeConID, " wrap: ", swipeWrapID);

	//set the innerHTML of the supplied div to now be setup for swiper integration
	divValue.innerHTML = "<div id=" + swipeConID + " class=\"swiper-container\">" + 
	"<div id=" + swipeWrapID + " class=\"swiper-wrapper\">" + 
	"</div>" +
	"</div>";

	self.borderSize = 1;

	console.log(divValue.innerHTML);

	self.swiper = new Swiper('#' + swipeConID,{
	    //Your options here:
	    // width: reqOptions.width,
	    // height: reqOptions.height,
	    // cssWidthAndHeight : true,
	    // initialSlide : 0,
	    // mode:'horizontal',
	    // loop: true
	    //etc..
	});  

	var uidCount = 0;
	var htmlObjects = {};
	var currentPageStartID = 0;
	var slideIDs = 0;

	var itemsPerRow = function()
	{
		return Math.floor(self.swiper.width/(self.objectSize.width + 2*(self.objectSize.rowMargin || 0 + self.borderSize)));
	}
	var itemsPerColumn = function()
	{
		return Math.floor(self.swiper.height/(self.objectSize.height + 2*(self.objectSize.columnMargin || 0 + self.borderSize)));
	}
	var maxItemsPerPage = function()
	{
		//the number = number holdable in a row * number of columns
		//at least 1 will be created -- old code -- maybe later
		return Math.max(itemsPerRow()*itemsPerColumn(), 0);// 1);
	}

	var internalAddPage = function(slideHTML)
	{
		var slide = self.swiper.createSlide(slideHTML);
		
		slide.sID = slideIDs++;

		slide.append();//insertAfter(0);

		//after add/removing we always reinit
		self.swiper.reInit();

		return slide;

	}

	self.resize = function()
	{
		if(!self.swiper.width || !self.swiper.height)
		{
			throw new Error("Swiper doesn't have any width or height for sizing container")
		}

	}

	self.fillPage = function(innerDiv)
	{	
		var rowItems = itemsPerRow();
		var colItems = itemsPerColumn();

		console.log('Width: ', self.swiper.width, " height: ", self.swiper.height);
		console.log("Row: ", rowItems, " col: ", colItems);

		for(var r=0; r < rowItems; r++)
		{
			for(var c=0; c < colItems; c++)
			{
				var objectUID = self.uid + "-object-" + uidCount++;
				var element = document.createElement('div');
				element.id = objectUID;
				element.style.width = self.objectSize.width + "px";
				element.style.height = self.objectSize.height + "px";
				element.style.marginLeft = self.objectSize.rowMargin + "px" || 0;
				element.style.marginRight = self.objectSize.rowMargin + "px" || 0;

				element.style.marginTop = self.objectSize.columnMargin + "px" || 0;
				element.style.marginBottom = self.objectSize.columnMargin + "px" || 0;
				element.style.border = (self.borderSize ? (self.borderSize + "px solid black") : 0);

				element.style.overflow = "hidden";
				// element.className += "grid-cell";
				element.innerHTML = "<div>"+objectUID+"</div>";

				//then add this little bugger to our page anyways
				innerDiv.appendChild(element);

			}
		}		
	}

	self.createNewPage = function()
	{
		var pageOutline = "<div class=\"flexvcenter\" style=\"border: 1px solid black; height:100%;\"></div>"
		var page = internalAddPage(pageOutline);
		var innerPage = page.firstElementChild;

		console.log("Inner page: ", innerPage, " child thing: ", innerPage.innerHTML);

		fillPage(innerPage);

		self.swiper.swipeTo(page.sID);
	}
	self.previousPage = function()
	{
		//much more needs to be done here, but just swipe for now

		self.swiper.swipePrev();


	}
	self.nextPage = function()
	{
		//much more needs to be done here, but just swipe for now

		self.swiper.swipeNext();


	}

	return self;
}



