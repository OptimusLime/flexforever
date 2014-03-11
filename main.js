
var Swiper = require('swiper');
var Emitter = require('emitter');

module.exports = flexforever; 

var uSwipeID = 0;


function flexforever(divValue, reqOptions)
{
	console.log(divValue);

	var self = this;


	if(!reqOptions || !reqOptions.objectSize || !reqOptions.objectSize.width || !reqOptions.objectSize.height)
		throw new Error("Can't use flexforever without options or objectSize");

	//add emitter properties to this object
	Emitter(self);

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
	var pageObjects = {};
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
	var objectIDToUID = function(idCount)
	{
		return self.uid + "-object-" + idCount;
	}

	var getElement = function(ix)
	{
		var objectUID = objectIDToUID(ix);
		return htmlObjects[objectUID];
	}

	var createElement = function(ix)
	{
		var element = document.createElement('div');
		var objectUID = objectIDToUID(ix);

		element.id = objectUID;
		element.style.width = self.objectSize.width + "px";
		element.style.height = self.objectSize.height + "px";
		element.style.marginLeft = self.objectSize.rowMargin + "px" || 0;
		element.style.marginRight = self.objectSize.rowMargin + "px" || 0;

		element.style.marginTop = self.objectSize.columnMargin + "px" || 0;
		element.style.marginBottom = self.objectSize.columnMargin + "px" || 0;
		element.style.border = (self.borderSize ? (self.borderSize + "px solid black") : 0);

		element.style.overflow = "hidden";

		return element;
	}

	var createElementsForPage = function(innerDiv)
	{	
		var rowItems = itemsPerRow();
		var colItems = itemsPerColumn();

		console.log('Width: ', self.swiper.width, " height: ", self.swiper.height);
		console.log("Row: ", rowItems, " col: ", colItems);

		var ix = 0;
		for(var r=0; r < rowItems; r++)
		{
			for(var c=0; c < colItems; c++)
			{
				var id = currentPageStartID + ix;
				
				//Check if we've created an object for this spot already (no dupes)
				var element = getElement(id);
				// if we haven't, we need to fix that
				if(!element && innerDiv)
				{
					//create the html object
					element = createElement(id);
					//add it to our cache of objects
					htmlObjects[objectIDToUID(id)] = element;

					//then add this little bugger to our page anyways
					innerDiv.appendChild(element);

					//inform someone this happened
					self.emit('elementCreated', element.id, element);
				}
				
				ix++;
			}
		}

		//ix represents how many objects we've annouced to
		return ix;		
	}

	var emitEventForCurrentPage = function(eventName, startID, pageDiv)
	{
		//let all current elements know they're being hidden
		var currentPage = pageDiv || self.swiper.activeSlide();

		var startID = (startID == undefined ? currentPageStartID : startID); 

		//grab the children -- we'll see how many to loop through
		var elementCount = currentPage.firstElementChild.children.length;

		for(var i=0; i < elementCount; i++)
		{
			var element = getElement(currentPageStartID + i);
			self.emit(eventName, element.id, element);
		}

		//return the number of affected elements
		return elementCount;	
	}
	var showPage = function(pageDiv)
	{
		return emitEventForCurrentPage('elementVisible', pageDiv);
	}

	var hidePage = function(pageDiv)
	{
		return emitEventForCurrentPage('elementHidden', pageDiv);		
	}

	self.createNewPage = function()
	{
		var pageOutline = "<div class=\"flexvcenter\" style=\"border: 1px solid black; height:100%;\"></div>"
		var page = internalAddPage(pageOutline);
		var innerPage = page.firstElementChild;

		pageObjects[page.sID] = page;

		console.log("Inner page: ", innerPage, " child thing: ", innerPage.innerHTML);

		var totalCreated = createElementsForPage(innerPage);




		//modified current page!
		currentPageStartID += totalAnnounced;

		self.moveToPage(page.sID);
	}
	self.moveToPage = function(pID)
	{
		var cSlideID = self.swiper.activeSlide().sID;

		var pageDif = (pID - cSlideID);

		//if it's not 0, then we're moving away from this page
		if(pageDif)
		{
			//tell all on page, they're being hidden
			hideCurrentPage();

			//we are moving (positive or negative), we should start with a particular object
			var newStartID = currentPageStartID + pageDif*ipp;

			//set our currentID to the new ID
			currentPageStartID = newStartID;

			//if the page exists, we'll let it know we're hosting some new content
			announceToPage('elementVisible', pageObjects[pID]);

			//now let's move (provided it's different)
			self.swiper.swipeTo(pID);

		}
		
	}

	self.previousPage = function()
	{
		//much more needs to be done here, but just swipe for now
		var cSlideID = self.swiper.activeSlide().sID;

		//going to move to previous slide -- fetch ID - 1
		var nPID = cSlideID -1;
		//need to make sure we don't have a negative slide (we're at the beginning)
		if(nPID >= 0)
		{
			//how many objects will we hide?
			var elementsHidden = hideCurrentPage();

			//now we're at another place
			//move backwards that many elements
			currentPageStartID -= elementsHidden;



			//read to swipe away
			self.swiper.swipePrev();
		}
	}
	self.nextPage = function()
	{
		//much more needs to be done here, but just swipe for now
		var cSlide = self.swiper.activeSlide().sID;

		//going to move to previous slide -- fetch ID + 1
		var nPID = cSlideID + 1;

		//grab our new page object -- the next slide
		var page = pageObjects[nPID];

		//need to make sure we have a place to move to (can't next page to create a new page by design)
		if(page)
		{
			//how many objects in our current slide
			var elementCount = hideCurrentPage();

			//now we're at another place IN THE FUTURE
			currentPageStartID += elementCount;

			//read to swipe away
			self.swiper.swipeNext();
		}
	}

	return self;
}



