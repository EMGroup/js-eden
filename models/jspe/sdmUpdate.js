if(SDM){
	//should be on as ive said its required in run.e
	
	SDM.systemObservableNames.push("buttonNext");
	SDM.systemObservableNames.push("buttonNextEnabled");
	SDM.systemObservableNames.push("buttonNext_clicked");
	SDM.systemObservableNames.push("buttonPrev");
	SDM.systemObservableNames.push("buttonPrevEnabled");
	SDM.systemObservableNames.push("buttonPrev_clicked");
	SDM.systemObservableNames.push("currentSlide");
	SDM.systemObservableNames.push("jspeleft");
	SDM.systemObservableNames.push("picture2");
	SDM.systemObservableNames.push("slideList");
	SDM.systemObservableNames.push("slideNumber");
	SDM.systemObservableNames.push("slides");
	
	SDM.systemAgentNames.push("cleanupSlides");
	SDM.systemAgentNames.push("clearSlides");
	SDM.systemAgentNames.push("disableButtons");
	SDM.systemAgentNames.push("drawPicture2");
	SDM.systemAgentNames.push("drawSlides");
	SDM.systemAgentNames.push("nextSlide");
	SDM.systemAgentNames.push("prevSlide");
	
	SDM.systemFunctionNames.push("SlideButton");
	SDM.systemFunctionNames.push("Slide");
	
}