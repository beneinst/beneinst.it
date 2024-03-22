/*------ favth-bootstrap.js ------*/
if(typeof jQuery==='undefined'){throw new Error('Bootstrap\'s JavaScript requires jQuery')}
+function($){'use strict';var version=$.fn.jquery.split(' ')[0].split('.')
if((version[0]<2&&version[1]<9)||(version[0]==1&&version[1]==9&&version[2]<1)||(version[0]>3)){throw new Error('Bootstrap\'s JavaScript requires jQuery version 1.9.1 or higher, but lower than version 4')}}(jQuery);+function($){'use strict';function transitionEnd(){var el=document.createElement('bootstrap')
var transEndEventNames={WebkitTransition:'webkitTransitionEnd',MozTransition:'transitionend',OTransition:'oTransitionEnd otransitionend',transition:'transitionend'}
for(var name in transEndEventNames){if(el.style[name]!==undefined){return{end:transEndEventNames[name]}}}
return false}
$.fn.emulateTransitionEnd=function(duration){var called=false
var $el=this
$(this).one('bsTransitionEnd',function(){called=true})
var callback=function(){if(!called)$($el).trigger($.support.transition.end)}
setTimeout(callback,duration)
return this}
$(function(){$.support.transition=transitionEnd()
if(!$.support.transition)return
$.event.special.bsTransitionEnd={bindType:$.support.transition.end,delegateType:$.support.transition.end,handle:function(e){if($(e.target).is(this))return e.handleObj.handler.apply(this,arguments)}}})}(jQuery);+function($){'use strict';var dismiss='[data-dismiss="favth-alert"]'
var Alert=function(el){$(el).on('click',dismiss,this.close)}
Alert.VERSION='3.3.7'
Alert.TRANSITION_DURATION=150
Alert.prototype.close=function(e){var $this=$(this)
var selector=$this.attr('data-target')
if(!selector){selector=$this.attr('href')
selector=selector&&selector.replace(/.*(?=#[^\s]*$)/,'')}
var $parent=$(selector==='#'?[]:selector)
if(e)e.preventDefault()
if(!$parent.length){$parent=$this.closest('.favth-alert')}
$parent.trigger(e=$.Event('close.bs.favth-alert'))
if(e.isDefaultPrevented())return
$parent.removeClass('favth-in')
function removeElement(){$parent.detach().trigger('closed.bs.favth-alert').remove()}
$.support.transition&&$parent.hasClass('favth-fade')?$parent.one('bsTransitionEnd',removeElement).emulateTransitionEnd(Alert.TRANSITION_DURATION):removeElement()}
function Plugin(option){return this.each(function(){var $this=$(this)
var data=$this.data('bs.favth-alert')
if(!data)$this.data('bs.favth-alert',(data=new Alert(this)))
if(typeof option=='string')data[option].call($this)})}
$.fn.favthalert=Plugin
$.fn.favthalert.Constructor=Alert
$(document).on('click.bs.favth-alert.data-api',dismiss,Alert.prototype.close)}(jQuery);+function($){'use strict';var Button=function(element,options){this.$element=$(element)
this.options=$.extend({},Button.DEFAULTS,options)
this.isLoading=false}
Button.VERSION='3.3.7'
Button.DEFAULTS={loadingText:'loading...'}
Button.prototype.setState=function(state){var d='disabled'
var $el=this.$element
var val=$el.is('input')?'val':'html'
var data=$el.data()
state+='Text'
if(data.resetText==null)$el.data('resetText',$el[val]())
setTimeout($.proxy(function(){$el[val](data[state]==null?this.options[state]:data[state])
if(state=='loadingText'){this.isLoading=true
$el.addClass('favth-'+d).attr(d,d).prop(d,true)}else if(this.isLoading){this.isLoading=false
$el.removeClass('favth-'+d).removeAttr(d).prop(d,false)}},this),0)}
Button.prototype.toggle=function(){var changed=true
var $parent=this.$element.closest('[data-toggle="favth-buttons"]')
if($parent.length){var $input=this.$element.find('input')
if($input.prop('type')=='radio'){if($input.prop('checked'))changed=false
$parent.find('.favth-active').removeClass('favth-active')
this.$element.addClass('favth-active')}else if($input.prop('type')=='checkbox'){if(($input.prop('checked'))!==this.$element.hasClass('favth-active'))changed=false
this.$element.toggleClass('favth-active')}
$input.prop('checked',this.$element.hasClass('favth-active'))
if(changed)$input.trigger('change')}else{this.$element.attr('aria-pressed',!this.$element.hasClass('favth-active'))
this.$element.toggleClass('favth-active')}}
function Plugin(option){return this.each(function(){var $this=$(this)
var data=$this.data('bs.favth-button')
var options=typeof option=='object'&&option
if(!data)$this.data('bs.favth-button',(data=new Button(this,options)))
if(option=='toggle')data.toggle()
else if(option)data.setState(option)})}
$.fn.favthbutton=Plugin
$.fn.favthbutton.Constructor=Button
$(document).on('click.bs.favth-button.data-api','[data-toggle^="favth-button"]',function(e){var $btn=$(e.target).closest('.favth-btn')
Plugin.call($btn,'toggle')
if(!($(e.target).is('input[type="radio"], input[type="checkbox"]'))){e.preventDefault()
if($btn.is('input,button'))$btn.trigger('focus')
else $btn.find('input:visible,button:visible').first().trigger('focus')}}).on('focus.bs.favth-button.data-api blur.bs.favth-button.data-api','[data-toggle^="favth-button"]',function(e){$(e.target).closest('.favth-btn').toggleClass('favth-focus',/^focus(in)?$/.test(e.type))})}(jQuery);+function($){'use strict';var Carousel=function(element,options){this.$element=$(element)
this.$indicators=this.$element.find('.favth-carousel-indicators')
this.options=options
this.paused=null
this.sliding=null
this.interval=null
this.$active=null
this.$items=null
this.options.keyboard&&this.$element.on('keydown.bs.favth-carousel',$.proxy(this.keydown,this))
this.options.pause=='hover'&&!('ontouchstart'in document.documentElement)&&this.$element.on('mouseenter.bs.favth-carousel',$.proxy(this.pause,this)).on('mouseleave.bs.favth-carousel',$.proxy(this.cycle,this))}
Carousel.VERSION='3.3.7'
Carousel.TRANSITION_DURATION=600
Carousel.DEFAULTS={interval:5000,pause:'hover',wrap:true,keyboard:true}
Carousel.prototype.keydown=function(e){if(/input|textarea/i.test(e.target.tagName))return
switch(e.which){case 37:this.prev();break
case 39:this.next();break
default:return}
e.preventDefault()}
Carousel.prototype.cycle=function(e){e||(this.paused=false)
this.interval&&clearInterval(this.interval)
this.options.interval&&!this.paused&&(this.interval=setInterval($.proxy(this.next,this),this.options.interval))
return this}
Carousel.prototype.getItemIndex=function(item){this.$items=item.parent().children('.favth-item')
return this.$items.index(item||this.$active)}
Carousel.prototype.getItemForDirection=function(direction,active){var activeIndex=this.getItemIndex(active)
var willWrap=(direction=='prev'&&activeIndex===0)||(direction=='next'&&activeIndex==(this.$items.length-1))
if(willWrap&&!this.options.wrap)return active
var delta=direction=='prev'?-1:1
var itemIndex=(activeIndex+delta)%this.$items.length
return this.$items.eq(itemIndex)}
Carousel.prototype.to=function(pos){var that=this
var activeIndex=this.getItemIndex(this.$active=this.$element.find('.favth-item.favth-active'))
if(pos>(this.$items.length-1)||pos<0)return
if(this.sliding)return this.$element.one('slid.bs.favth-carousel',function(){that.to(pos)})
if(activeIndex==pos)return this.pause().cycle()
return this.slide(pos>activeIndex?'next':'prev',this.$items.eq(pos))}
Carousel.prototype.pause=function(e){e||(this.paused=true)
if(this.$element.find('.favth-next, .favth-prev').length&&$.support.transition){this.$element.trigger($.support.transition.end)
this.cycle(true)}
this.interval=clearInterval(this.interval)
return this}
Carousel.prototype.next=function(){if(this.sliding)return
return this.slide('next')}
Carousel.prototype.prev=function(){if(this.sliding)return
return this.slide('prev')}
Carousel.prototype.slide=function(type,next){var $active=this.$element.find('.favth-item.favth-active')
var $next=next||this.getItemForDirection(type,$active)
var isCycling=this.interval
var direction=type=='next'?'left':'right'
var that=this
if($next.hasClass('favth-active'))return(this.sliding=false)
var relatedTarget=$next[0]
var slideEvent=$.Event('slide.bs.favth-carousel',{relatedTarget:relatedTarget,direction:direction})
this.$element.trigger(slideEvent)
if(slideEvent.isDefaultPrevented())return
this.sliding=true
isCycling&&this.pause()
if(this.$indicators.length){this.$indicators.find('.favth-active').removeClass('favth-active')
var $nextIndicator=$(this.$indicators.children()[this.getItemIndex($next)])
$nextIndicator&&$nextIndicator.addClass('favth-active')}
var slidEvent=$.Event('slid.bs.favth-carousel',{relatedTarget:relatedTarget,direction:direction})
if($.support.transition&&this.$element.hasClass('favth-slide')){$next.addClass('favth-'+type)
$next[0].offsetWidth
$active.addClass('favth-'+direction)
$next.addClass('favth-'+direction)
$active.one('bsTransitionEnd',function(){$next.removeClass(['favth-'+type,'favth-'+direction].join(' ')).addClass('favth-active')
$active.removeClass(['favth-active','favth-'+direction].join(' '))
that.sliding=false
setTimeout(function(){that.$element.trigger(slidEvent)},0)}).emulateTransitionEnd(Carousel.TRANSITION_DURATION)}else{$active.removeClass('favth-active')
$next.addClass('favth-active')
this.sliding=false
this.$element.trigger(slidEvent)}
isCycling&&this.cycle()
return this}
function Plugin(option){return this.each(function(){var $this=$(this)
var data=$this.data('bs.favth-carousel')
var options=$.extend({},Carousel.DEFAULTS,$this.data(),typeof option=='object'&&option)
var action=typeof option=='string'?option:options.slide
if(!data)$this.data('bs.favth-carousel',(data=new Carousel(this,options)))
if(typeof option=='number')data.to(option)
else if(action)data[action]()
else if(options.interval)data.pause().cycle()})}
$.fn.favthcarousel=Plugin
$.fn.favthcarousel.Constructor=Carousel
var clickHandler=function(e){var href
var $this=$(this)
var $target=$($this.attr('data-target')||(href=$this.attr('href'))&&href.replace(/.*(?=#[^\s]+$)/,''))
if(!$target.hasClass('favth-carousel'))return
var options=$.extend({},$target.data(),$this.data())
var slideIndex=$this.attr('favth-data-slide-to')
if(slideIndex)options.interval=false
Plugin.call($target,options)
if(slideIndex){$target.data('bs.favth-carousel').to(slideIndex)}
e.preventDefault()}
$(document).on('click.bs.favth-carousel.data-api','[data-slide]',clickHandler).on('click.bs.favth-carousel.data-api','[favth-data-slide-to]',clickHandler)
$(window).on('load',function(){$('[data-ride="favth-carousel"]').each(function(){var $carousel=$(this)
Plugin.call($carousel,$carousel.data())})})}(jQuery);+function($){'use strict';var Collapse=function(element,options){this.$element=$(element)
this.options=$.extend({},Collapse.DEFAULTS,options)
this.$trigger=$('[data-toggle="favth-collapse"][href="#'+element.id+'"],'+'[data-toggle="favth-collapse"][data-target="#'+element.id+'"]')
this.transitioning=null
if(this.options.parent){this.$parent=this.getParent()}else{this.addAriaAndCollapsedClass(this.$element,this.$trigger)}
if(this.options.toggle)this.toggle()}
Collapse.VERSION='3.3.7'
Collapse.TRANSITION_DURATION=350
Collapse.DEFAULTS={toggle:true}
Collapse.prototype.dimension=function(){var hasWidth=this.$element.hasClass('width')
return hasWidth?'width':'height'}
Collapse.prototype.show=function(){if(this.transitioning||this.$element.hasClass('favth-in'))return
var activesData
var actives=this.$parent&&this.$parent.children('.favth-panel').children('.favth-in, .favth-collapsing')
if(actives&&actives.length){activesData=actives.data('bs.favth-collapse')
if(activesData&&activesData.transitioning)return}
var startEvent=$.Event('show.bs.favth-collapse')
this.$element.trigger(startEvent)
if(startEvent.isDefaultPrevented())return
if(actives&&actives.length){Plugin.call(actives,'hide')
activesData||actives.data('bs.favth-collapse',null)}
var dimension=this.dimension()
this.$element.removeClass('favth-collapse').addClass('favth-collapsing')[dimension](0).attr('aria-expanded',true)
this.$trigger.removeClass('favth-collapsed').attr('aria-expanded',true)
this.transitioning=1
var complete=function(){this.$element.removeClass('favth-collapsing').addClass('favth-collapse favth-in')[dimension]('')
this.transitioning=0
this.$element.trigger('shown.bs.favth-collapse')}
if(!$.support.transition)return complete.call(this)
var scrollSize=$.camelCase(['scroll',dimension].join('-'))
this.$element.one('bsTransitionEnd',$.proxy(complete,this)).emulateTransitionEnd(Collapse.TRANSITION_DURATION)[dimension](this.$element[0][scrollSize])}
Collapse.prototype.hide=function(){if(this.transitioning||!this.$element.hasClass('favth-in'))return
var startEvent=$.Event('hide.bs.favth-collapse')
this.$element.trigger(startEvent)
if(startEvent.isDefaultPrevented())return
var dimension=this.dimension()
this.$element[dimension](this.$element[dimension]())[0].offsetHeight
this.$element.addClass('favth-collapsing').removeClass('favth-collapse favth-in').attr('aria-expanded',false)
this.$trigger.addClass('favth-collapsed').attr('aria-expanded',false)
this.transitioning=1
var complete=function(){this.transitioning=0
this.$element.removeClass('favth-collapsing').addClass('favth-collapse').trigger('hidden.bs.favth-collapse')}
if(!$.support.transition)return complete.call(this)
this.$element
[dimension](0).one('bsTransitionEnd',$.proxy(complete,this)).emulateTransitionEnd(Collapse.TRANSITION_DURATION)}
Collapse.prototype.toggle=function(){this[this.$element.hasClass('favth-in')?'hide':'show']()}
Collapse.prototype.getParent=function(){return $(this.options.parent).find('[data-toggle="favth-collapse"][data-parent="'+this.options.parent+'"]').each($.proxy(function(i,element){var $element=$(element)
this.addAriaAndCollapsedClass(getTargetFromTrigger($element),$element)},this)).end()}
Collapse.prototype.addAriaAndCollapsedClass=function($element,$trigger){var isOpen=$element.hasClass('favth-in')
$element.attr('aria-expanded',isOpen)
$trigger.toggleClass('favth-collapsed',!isOpen).attr('aria-expanded',isOpen)}
function getTargetFromTrigger($trigger){var href
var target=$trigger.attr('data-target')||(href=$trigger.attr('href'))&&href.replace(/.*(?=#[^\s]+$)/,'')
return $(target)}
function Plugin(option){return this.each(function(){var $this=$(this)
var data=$this.data('bs.favth-collapse')
var options=$.extend({},Collapse.DEFAULTS,$this.data(),typeof option=='object'&&option)
if(!data&&options.toggle&&/show|hide/.test(option))options.toggle=false
if(!data)$this.data('bs.favth-collapse',(data=new Collapse(this,options)))
if(typeof option=='string')data[option]()})}
$.fn.favthcollapse=Plugin
$.fn.favthcollapse.Constructor=Collapse
$(document).on('click.bs.favth-collapse.data-api','[data-toggle="favth-collapse"]',function(e){var $this=$(this)
if(!$this.attr('data-target'))e.preventDefault()
var $target=getTargetFromTrigger($this)
var data=$target.data('bs.favth-collapse')
var option=data?'toggle':$this.data()
Plugin.call($target,option)})}(jQuery);+function($){'use strict';var backdrop='.favth-dropdown-backdrop'
var toggle='[data-toggle="favth-dropdown"]'
var Dropdown=function(element){$(element).on('click.bs.favth-dropdown',this.toggle)}
Dropdown.VERSION='3.3.7'
function getParent($this){var selector=$this.attr('data-target')
if(!selector){selector=$this.attr('href')
selector=selector&&/#[A-Za-z]/.test(selector)&&selector.replace(/.*(?=#[^\s]*$)/,'')}
var $parent=selector&&$(selector)
return $parent&&$parent.length?$parent:$this.parent()}
function clearMenus(e){if(e&&e.which===3)return
$(backdrop).remove()
$(toggle).each(function(){var $this=$(this)
var $parent=getParent($this)
var relatedTarget={relatedTarget:this}
if(!$parent.hasClass('favth-open'))return
if(e&&e.type=='click'&&/input|textarea/i.test(e.target.tagName)&&$.contains($parent[0],e.target))return
$parent.trigger(e=$.Event('hide.bs.favth-dropdown',relatedTarget))
if(e.isDefaultPrevented())return
$this.attr('aria-expanded','false')
$parent.removeClass('favth-open').trigger($.Event('hidden.bs.favth-dropdown',relatedTarget))})}
Dropdown.prototype.toggle=function(e){var $this=$(this)
if($this.is('.favth-disabled, :disabled'))return
var $parent=getParent($this)
var isActive=$parent.hasClass('favth-open')
clearMenus()
if(!isActive){if('ontouchstart'in document.documentElement&&!$parent.closest('.favth-navbar-nav').length){$(document.createElement('div')).addClass('favth-dropdown-backdrop').insertAfter($(this)).on('click',clearMenus)}
var relatedTarget={relatedTarget:this}
$parent.trigger(e=$.Event('show.bs.favth-dropdown',relatedTarget))
if(e.isDefaultPrevented())return
$this.trigger('focus').attr('aria-expanded','true')
$parent.toggleClass('favth-open').trigger($.Event('shown.bs.favth-dropdown',relatedTarget))}
return false}
Dropdown.prototype.keydown=function(e){if(!/(38|40|27|32)/.test(e.which)||/input|textarea/i.test(e.target.tagName))return
var $this=$(this)
e.preventDefault()
e.stopPropagation()
if($this.is('.favth-disabled, :disabled'))return
var $parent=getParent($this)
var isActive=$parent.hasClass('favth-open')
if(!isActive&&e.which!=27||isActive&&e.which==27){if(e.which==27)$parent.find(toggle).trigger('focus')
return $this.trigger('click')}
var desc=' li:not(.favth-disabled):visible a'
var $items=$parent.find('.favth-dropdown-menu'+desc)
if(!$items.length)return
var index=$items.index(e.target)
if(e.which==38&&index>0)index--
if(e.which==40&&index<$items.length-1)index++
if(!~index)index=0
$items.eq(index).trigger('focus')}
function Plugin(option){return this.each(function(){var $this=$(this)
var data=$this.data('bs.favth-dropdown')
if(!data)$this.data('bs.favth-dropdown',(data=new Dropdown(this)))
if(typeof option=='string')data[option].call($this)})}
$.fn.favthdropdown=Plugin
$.fn.favthdropdown.Constructor=Dropdown
$(document).on('click.bs.favth-dropdown.data-api',clearMenus).on('click.bs.favth-dropdown.data-api','.favth-dropdown form',function(e){e.stopPropagation()}).on('click.bs.favth-dropdown.data-api',toggle,Dropdown.prototype.toggle).on('keydown.bs.favth-dropdown.data-api',toggle,Dropdown.prototype.keydown).on('keydown.bs.favth-dropdown.data-api','.favth-dropdown-menu',Dropdown.prototype.keydown)}(jQuery);+function($){'use strict';var Modal=function(element,options){this.options=options
this.$body=$(document.body)
this.$element=$(element)
this.$dialog=this.$element.find('.favth-modal-dialog')
this.$backdrop=null
this.isShown=null
this.originalBodyPad=null
this.scrollbarWidth=0
this.ignoreBackdropClick=false
if(this.options.remote){this.$element.find('.favth-modal-content').load(this.options.remote,$.proxy(function(){this.$element.trigger('loaded.bs.favth-modal')},this))}}
Modal.VERSION='3.3.7'
Modal.TRANSITION_DURATION=300
Modal.BACKDROP_TRANSITION_DURATION=150
Modal.DEFAULTS={backdrop:true,keyboard:true,show:true}
Modal.prototype.toggle=function(_relatedTarget){return this.isShown?this.hide():this.show(_relatedTarget)}
Modal.prototype.show=function(_relatedTarget){var that=this
var e=$.Event('show.bs.favth-modal',{relatedTarget:_relatedTarget})
this.$element.trigger(e)
if(this.isShown||e.isDefaultPrevented())return
this.isShown=true
this.checkScrollbar()
this.setScrollbar()
this.$body.addClass('favth-modal-open')
this.escape()
this.resize()
this.$element.on('click.dismiss.bs.favth-modal','[data-dismiss="favth-modal"]',$.proxy(this.hide,this))
this.$dialog.on('mousedown.dismiss.bs.favth-modal',function(){that.$element.one('mouseup.dismiss.bs.favth-modal',function(e){if($(e.target).is(that.$element))that.ignoreBackdropClick=true})})
this.backdrop(function(){var transition=$.support.transition&&that.$element.hasClass('favth-fade')
if(!that.$element.parent().length){that.$element.appendTo(that.$body)}
that.$element.show().scrollTop(0)
that.adjustDialog()
if(transition){that.$element[0].offsetWidth}
that.$element.addClass('favth-in')
that.enforceFocus()
var e=$.Event('shown.bs.favth-modal',{relatedTarget:_relatedTarget})
transition?that.$dialog.one('bsTransitionEnd',function(){that.$element.trigger('focus').trigger(e)}).emulateTransitionEnd(Modal.TRANSITION_DURATION):that.$element.trigger('focus').trigger(e)})}
Modal.prototype.hide=function(e){if(e)e.preventDefault()
e=$.Event('hide.bs.favth-modal')
this.$element.trigger(e)
if(!this.isShown||e.isDefaultPrevented())return
this.isShown=false
this.escape()
this.resize()
$(document).off('focusin.bs.favth-modal')
this.$element.removeClass('favth-in').off('click.dismiss.bs.favth-modal').off('mouseup.dismiss.bs.favth-modal')
this.$dialog.off('mousedown.dismiss.bs.favth-modal')
$.support.transition&&this.$element.hasClass('favth-fade')?this.$element.one('bsTransitionEnd',$.proxy(this.hideModal,this)).emulateTransitionEnd(Modal.TRANSITION_DURATION):this.hideModal()}
Modal.prototype.enforceFocus=function(){$(document).off('focusin.bs.favth-modal').on('focusin.bs.favth-modal',$.proxy(function(e){if(document!==e.target&&this.$element[0]!==e.target&&!this.$element.has(e.target).length){this.$element.trigger('focus')}},this))}
Modal.prototype.escape=function(){if(this.isShown&&this.options.keyboard){this.$element.on('keydown.dismiss.bs.favth-modal',$.proxy(function(e){e.which==27&&this.hide()},this))}else if(!this.isShown){this.$element.off('keydown.dismiss.bs.favth-modal')}}
Modal.prototype.resize=function(){if(this.isShown){$(window).on('resize.bs.favth-modal',$.proxy(this.handleUpdate,this))}else{$(window).off('resize.bs.favth-modal')}}
Modal.prototype.hideModal=function(){var that=this
this.$element.hide()
this.backdrop(function(){that.$body.removeClass('favth-modal-open')
that.resetAdjustments()
that.resetScrollbar()
that.$element.trigger('hidden.bs.favth-modal')})}
Modal.prototype.removeBackdrop=function(){this.$backdrop&&this.$backdrop.remove()
this.$backdrop=null}
Modal.prototype.backdrop=function(callback){var that=this
var animate=this.$element.hasClass('favth-fade')?'favth-fade':''
if(this.isShown&&this.options.backdrop){var doAnimate=$.support.transition&&animate
this.$backdrop=$(document.createElement('div')).addClass('favth-modal-backdrop '+animate).appendTo(this.$body)
this.$element.on('click.dismiss.bs.favth-modal',$.proxy(function(e){if(this.ignoreBackdropClick){this.ignoreBackdropClick=false
return}
if(e.target!==e.currentTarget)return
this.options.backdrop=='static'?this.$element[0].focus():this.hide()},this))
if(doAnimate)this.$backdrop[0].offsetWidth
this.$backdrop.addClass('favth-in')
if(!callback)return
doAnimate?this.$backdrop.one('bsTransitionEnd',callback).emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION):callback()}else if(!this.isShown&&this.$backdrop){this.$backdrop.removeClass('favth-in')
var callbackRemove=function(){that.removeBackdrop()
callback&&callback()}
$.support.transition&&this.$element.hasClass('favth-fade')?this.$backdrop.one('bsTransitionEnd',callbackRemove).emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION):callbackRemove()}else if(callback){callback()}}
Modal.prototype.handleUpdate=function(){this.adjustDialog()}
Modal.prototype.adjustDialog=function(){var modalIsOverflowing=this.$element[0].scrollHeight>document.documentElement.clientHeight
this.$element.css({paddingLeft:!this.bodyIsOverflowing&&modalIsOverflowing?this.scrollbarWidth:'',paddingRight:this.bodyIsOverflowing&&!modalIsOverflowing?this.scrollbarWidth:''})}
Modal.prototype.resetAdjustments=function(){this.$element.css({paddingLeft:'',paddingRight:''})}
Modal.prototype.checkScrollbar=function(){var fullWindowWidth=window.innerWidth
if(!fullWindowWidth){var documentElementRect=document.documentElement.getBoundingClientRect()
fullWindowWidth=documentElementRect.right-Math.abs(documentElementRect.left)}
this.bodyIsOverflowing=document.body.clientWidth<fullWindowWidth
this.scrollbarWidth=this.measureScrollbar()}
Modal.prototype.setScrollbar=function(){var bodyPad=parseInt((this.$body.css('padding-right')||0),10)
this.originalBodyPad=document.body.style.paddingRight||''
if(this.bodyIsOverflowing)this.$body.css('padding-right',bodyPad+this.scrollbarWidth)}
Modal.prototype.resetScrollbar=function(){this.$body.css('padding-right',this.originalBodyPad)}
Modal.prototype.measureScrollbar=function(){var scrollDiv=document.createElement('div')
scrollDiv.className='favth-modal-scrollbar-measure'
this.$body.append(scrollDiv)
var scrollbarWidth=scrollDiv.offsetWidth-scrollDiv.clientWidth
this.$body[0].removeChild(scrollDiv)
return scrollbarWidth}
function Plugin(option,_relatedTarget){return this.each(function(){var $this=$(this)
var data=$this.data('bs.favth-modal')
var options=$.extend({},Modal.DEFAULTS,$this.data(),typeof option=='object'&&option)
if(!data)$this.data('bs.favth-modal',(data=new Modal(this,options)))
if(typeof option=='string')data[option](_relatedTarget)
else if(options.show)data.show(_relatedTarget)})}
$.fn.favthmodal=Plugin
$.fn.favthmodal.Constructor=Modal
$(document).on('click.bs.favth-modal.data-api','[data-toggle="favth-modal"]',function(e){var $this=$(this)
var href=$this.attr('href')
var $target=$($this.attr('data-target')||(href&&href.replace(/.*(?=#[^\s]+$)/,'')))
var option=$target.data('bs.favth-modal')?'toggle':$.extend({remote:!/#/.test(href)&&href},$target.data(),$this.data())
if($this.is('a'))e.preventDefault()
$target.one('show.bs.favth-modal',function(showEvent){if(showEvent.isDefaultPrevented())return
$target.one('hidden.bs.favth-modal',function(){$this.is(':visible')&&$this.trigger('focus')})})
Plugin.call($target,option,this)})}(jQuery);+function($){'use strict';var Tooltip=function(element,options){this.type=null
this.options=null
this.enabled=null
this.timeout=null
this.hoverState=null
this.$element=null
this.inState=null
this.init('favth-tooltip',element,options)}
Tooltip.VERSION='3.3.7'
Tooltip.TRANSITION_DURATION=150
Tooltip.DEFAULTS={animation:true,placement:'top',selector:false,template:'<div class="favth-tooltip" role="favth-tooltip"><div class="favth-tooltip-arrow"></div><div class="favth-tooltip-inner"></div></div>',trigger:'hover focus',title:'',delay:0,html:false,container:false,viewport:{selector:'body',padding:0}}
Tooltip.prototype.init=function(type,element,options){this.enabled=true
this.type=type
this.$element=$(element)
this.options=this.getOptions(options)
this.$viewport=this.options.viewport&&$($.isFunction(this.options.viewport)?this.options.viewport.call(this,this.$element):(this.options.viewport.selector||this.options.viewport))
this.inState={favclick:false,favhover:false,favfocus:false}
if(this.$element[0]instanceof document.constructor&&!this.options.selector){throw new Error('`selector` option must be specified when initializing '+this.type+' on the window.document object!')}
var triggers=this.options.trigger.split(' ')
for(var i=triggers.length;i--;){var trigger=triggers[i]
if(trigger=='click'){this.$element.on('click.'+this.type,this.options.selector,$.proxy(this.toggle,this))}else if(trigger!='manual'){var eventIn=trigger=='hover'?'mouseenter':'focusin'
var eventOut=trigger=='hover'?'mouseleave':'focusout'
this.$element.on(eventIn+'.'+this.type,this.options.selector,$.proxy(this.enter,this))
this.$element.on(eventOut+'.'+this.type,this.options.selector,$.proxy(this.leave,this))}}
this.options.selector?(this._options=$.extend({},this.options,{trigger:'manual',selector:''})):this.fixTitle()}
Tooltip.prototype.getDefaults=function(){return Tooltip.DEFAULTS}
Tooltip.prototype.getOptions=function(options){options=$.extend({},this.getDefaults(),this.$element.data(),options)
if(options.delay&&typeof options.delay=='number'){options.delay={show:options.delay,hide:options.delay}}
return options}
Tooltip.prototype.getDelegateOptions=function(){var options={}
var defaults=this.getDefaults()
this._options&&$.each(this._options,function(key,value){if(defaults[key]!=value)options[key]=value})
return options}
Tooltip.prototype.enter=function(obj){var self=obj instanceof this.constructor?obj:$(obj.currentTarget).data('bs.favth-'+this.type)
if(!self){self=new this.constructor(obj.currentTarget,this.getDelegateOptions())
$(obj.currentTarget).data('bs.favth-'+this.type,self)}
if(obj instanceof $.Event){self.inState[obj.type=='focusin'?'focus':'hover']=true}
if(self.tip().hasClass('favth-in')||self.hoverState=='in'){self.hoverState='in'
return}
clearTimeout(self.timeout)
self.hoverState='in'
if(!self.options.delay||!self.options.delay.show)return self.show()
self.timeout=setTimeout(function(){if(self.hoverState=='in')self.show()},self.options.delay.show)}
Tooltip.prototype.isInStateTrue=function(){for(var key in this.inState){if(this.inState[key])return true}
return false}
Tooltip.prototype.leave=function(obj){var self=obj instanceof this.constructor?obj:$(obj.currentTarget).data('bs.favth-'+this.type)
if(!self){self=new this.constructor(obj.currentTarget,this.getDelegateOptions())
$(obj.currentTarget).data('bs.favth-'+this.type,self)}
if(obj instanceof $.Event){self.inState[obj.type=='focusout'?'focus':'hover']=false}
if(self.isInStateTrue())return
clearTimeout(self.timeout)
self.hoverState='out'
if(!self.options.delay||!self.options.delay.hide)return self.hide()
self.timeout=setTimeout(function(){if(self.hoverState=='out')self.hide()},self.options.delay.hide)}
Tooltip.prototype.show=function(){var e=$.Event('show.bs.favth-'+this.type)
if(this.hasContent()&&this.enabled){this.$element.trigger(e)
var inDom=$.contains(this.$element[0].ownerDocument.documentElement,this.$element[0])
if(e.isDefaultPrevented()||!inDom)return
var that=this
var $tip=this.tip()
var tipId=this.getUID(this.type)
this.setContent()
$tip.attr('id',tipId)
this.$element.attr('favth-aria-describedby',tipId)
if(this.options.animation)$tip.addClass('favth-fade')
var placement=typeof this.options.placement=='function'?this.options.placement.call(this,$tip[0],this.$element[0]):this.options.placement
var autoToken=/\s?auto?\s?/i
var autoPlace=autoToken.test(placement)
if(autoPlace)placement=placement.replace(autoToken,'')||'top'
$tip.detach().css({top:0,left:0,display:'block'}).addClass('favth-'+placement).data('bs.favth-'+this.type,this)
this.options.container?$tip.appendTo(this.options.container):$tip.insertAfter(this.$element)
this.$element.trigger('inserted.bs.favth-'+this.type)
var pos=this.getPosition()
var actualWidth=$tip[0].offsetWidth
var actualHeight=$tip[0].offsetHeight
if(autoPlace){var orgPlacement=placement
var viewportDim=this.getPosition(this.$viewport)
placement=placement=='bottom'&&pos.bottom+actualHeight>viewportDim.bottom?'top':placement=='top'&&pos.top-actualHeight<viewportDim.top?'bottom':placement=='right'&&pos.right+actualWidth>viewportDim.width?'left':placement=='left'&&pos.left-actualWidth<viewportDim.left?'right':placement
$tip.removeClass('favth-'+orgPlacement).addClass('favth-'+placement)}
var calculatedOffset=this.getCalculatedOffset(placement,pos,actualWidth,actualHeight)
this.applyPlacement(calculatedOffset,placement)
var complete=function(){var prevHoverState=that.hoverState
that.$element.trigger('shown.bs.favth-'+that.type)
that.hoverState=null
if(prevHoverState=='out')that.leave(that)}
$.support.transition&&this.$tip.hasClass('favth-fade')?$tip.one('bsTransitionEnd',complete).emulateTransitionEnd(Tooltip.TRANSITION_DURATION):complete()}}
Tooltip.prototype.applyPlacement=function(offset,placement){var $tip=this.tip()
var width=$tip[0].offsetWidth
var height=$tip[0].offsetHeight
var marginTop=parseInt($tip.css('margin-top'),10)
var marginLeft=parseInt($tip.css('margin-left'),10)
if(isNaN(marginTop))marginTop=0
if(isNaN(marginLeft))marginLeft=0
offset.top+=marginTop
offset.left+=marginLeft
$.offset.setOffset($tip[0],$.extend({using:function(props){$tip.css({top:Math.round(props.top),left:Math.round(props.left)})}},offset),0)
$tip.addClass('favth-in')
var actualWidth=$tip[0].offsetWidth
var actualHeight=$tip[0].offsetHeight
if(placement=='top'&&actualHeight!=height){offset.top=offset.top+height-actualHeight}
var delta=this.getViewportAdjustedDelta(placement,offset,actualWidth,actualHeight)
if(delta.left)offset.left+=delta.left
else offset.top+=delta.top
var isVertical=/top|bottom/.test(placement)
var arrowDelta=isVertical?delta.left*2-width+actualWidth:delta.top*2-height+actualHeight
var arrowOffsetPosition=isVertical?'offsetWidth':'offsetHeight'
$tip.offset(offset)
this.replaceArrow(arrowDelta,$tip[0][arrowOffsetPosition],isVertical)}
Tooltip.prototype.replaceArrow=function(delta,dimension,isVertical){this.arrow().css(isVertical?'left':'top',50*(1-delta / dimension)+'%').css(isVertical?'top':'left','')}
Tooltip.prototype.setContent=function(){var $tip=this.tip()
var title=this.getTitle()
$tip.find('.favth-tooltip-inner')[this.options.html?'html':'text'](title)
$tip.removeClass('favth-fade favth-in favth-top favth-bottom favth-left favth-right')}
Tooltip.prototype.hide=function(callback){var that=this
var $tip=$(this.$tip)
var e=$.Event('hide.bs.favth-'+this.type)
function complete(){if(that.hoverState!='in')$tip.detach()
if(that.$element){that.$element.removeAttr('favth-aria-describedby').trigger('hidden.bs.favth-'+that.type)}
callback&&callback()}
this.$element.trigger(e)
if(e.isDefaultPrevented())return
$tip.removeClass('favth-in')
$.support.transition&&$tip.hasClass('favth-fade')?$tip.one('bsTransitionEnd',complete).emulateTransitionEnd(Tooltip.TRANSITION_DURATION):complete()
this.hoverState=null
return this}
Tooltip.prototype.fixTitle=function(){var $e=this.$element
if($e.attr('title')||typeof $e.attr('favth-data-original-title')!='string'){$e.attr('favth-data-original-title',$e.attr('title')||'').attr('title','')}}
Tooltip.prototype.hasContent=function(){return this.getTitle()}
Tooltip.prototype.getPosition=function($element){$element=$element||this.$element
var el=$element[0]
var isBody=el.tagName=='BODY'
var elRect=el.getBoundingClientRect()
if(elRect.width==null){elRect=$.extend({},elRect,{width:elRect.right-elRect.left,height:elRect.bottom-elRect.top})}
var isSvg=window.SVGElement&&el instanceof window.SVGElement
var elOffset=isBody?{top:0,left:0}:(isSvg?null:$element.offset())
var scroll={scroll:isBody?document.documentElement.scrollTop||document.body.scrollTop:$element.scrollTop()}
var outerDims=isBody?{width:$(window).width(),height:$(window).height()}:null
return $.extend({},elRect,scroll,outerDims,elOffset)}
Tooltip.prototype.getCalculatedOffset=function(placement,pos,actualWidth,actualHeight){return placement=='bottom'?{top:pos.top+pos.height,left:pos.left+pos.width / 2-actualWidth / 2}:placement=='top'?{top:pos.top-actualHeight,left:pos.left+pos.width / 2-actualWidth / 2}:placement=='left'?{top:pos.top+pos.height / 2-actualHeight / 2,left:pos.left-actualWidth}:{top:pos.top+pos.height / 2-actualHeight / 2,left:pos.left+pos.width}}
Tooltip.prototype.getViewportAdjustedDelta=function(placement,pos,actualWidth,actualHeight){var delta={top:0,left:0}
if(!this.$viewport)return delta
var viewportPadding=this.options.viewport&&this.options.viewport.padding||0
var viewportDimensions=this.getPosition(this.$viewport)
if(/right|left/.test(placement)){var topEdgeOffset=pos.top-viewportPadding-viewportDimensions.scroll
var bottomEdgeOffset=pos.top+viewportPadding-viewportDimensions.scroll+actualHeight
if(topEdgeOffset<viewportDimensions.top){delta.top=viewportDimensions.top-topEdgeOffset}else if(bottomEdgeOffset>viewportDimensions.top+viewportDimensions.height){delta.top=viewportDimensions.top+viewportDimensions.height-bottomEdgeOffset}}else{var leftEdgeOffset=pos.left-viewportPadding
var rightEdgeOffset=pos.left+viewportPadding+actualWidth
if(leftEdgeOffset<viewportDimensions.left){delta.left=viewportDimensions.left-leftEdgeOffset}else if(rightEdgeOffset>viewportDimensions.right){delta.left=viewportDimensions.left+viewportDimensions.width-rightEdgeOffset}}
return delta}
Tooltip.prototype.getTitle=function(){var title
var $e=this.$element
var o=this.options
title=$e.attr('favth-data-original-title')||(typeof o.title=='function'?o.title.call($e[0]):o.title)
return title}
Tooltip.prototype.getUID=function(prefix){do prefix+=~~(Math.random()*1000000)
while(document.getElementById(prefix))
return prefix}
Tooltip.prototype.tip=function(){if(!this.$tip){this.$tip=$(this.options.template)
if(this.$tip.length!=1){throw new Error(this.type+' `template` option must consist of exactly 1 top-level element!')}}
return this.$tip}
Tooltip.prototype.arrow=function(){return(this.$arrow=this.$arrow||this.tip().find('.favth-tooltip-arrow'))}
Tooltip.prototype.enable=function(){this.enabled=true}
Tooltip.prototype.disable=function(){this.enabled=false}
Tooltip.prototype.toggleEnabled=function(){this.enabled=!this.enabled}
Tooltip.prototype.toggle=function(e){var self=this
if(e){self=$(e.currentTarget).data('bs.favth-'+this.type)
if(!self){self=new this.constructor(e.currentTarget,this.getDelegateOptions())
$(e.currentTarget).data('bs.favth-'+this.type,self)}}
if(e){self.inState.click=!self.inState.click
if(self.isInStateTrue())self.enter(self)
else self.leave(self)}else{self.tip().hasClass('favth-in')?self.leave(self):self.enter(self)}}
Tooltip.prototype.destroy=function(){var that=this
clearTimeout(this.timeout)
this.hide(function(){that.$element.off('.'+that.type).removeData('bs.favth-'+that.type)
if(that.$tip){that.$tip.detach()}
that.$tip=null
that.$arrow=null
that.$viewport=null
that.$element=null})}
function Plugin(option){return this.each(function(){var $this=$(this)
var data=$this.data('bs.favth-tooltip')
var options=typeof option=='object'&&option
if(!data&&/destroy|hide/.test(option))return
if(!data)$this.data('bs.favth-tooltip',(data=new Tooltip(this,options)))
if(typeof option=='string')data[option]()})}
$.fn.favthtooltip=Plugin
$.fn.favthtooltip.Constructor=Tooltip}(jQuery);+function($){'use strict';var Popover=function(element,options){this.init('popover',element,options)}
if(!$.fn.favthtooltip)throw new Error('Popover requires tooltip.js')
Popover.VERSION='3.3.7'
Popover.DEFAULTS=$.extend({},$.fn.favthtooltip.Constructor.DEFAULTS,{placement:'right',trigger:'click',content:'',template:'<div class="favth-popover" role="favth-tooltip"><div class="favth-arrow"></div><h3 class="favth-popover-title"></h3><div class="favth-popover-content"></div></div>'})
Popover.prototype=$.extend({},$.fn.favthtooltip.Constructor.prototype)
Popover.prototype.constructor=Popover
Popover.prototype.getDefaults=function(){return Popover.DEFAULTS}
Popover.prototype.setContent=function(){var $tip=this.tip()
var title=this.getTitle()
var content=this.getContent()
$tip.find('.favth-popover-title')[this.options.html?'html':'text'](title)
$tip.find('.favth-popover-content').children().detach().end()[this.options.html?(typeof content=='string'?'html':'append'):'text'](content)
$tip.removeClass('favth-fade favth-top favth-bottom favth-left favth-right favth-in')
if(!$tip.find('.favth-popover-title').html())$tip.find('.favth-popover-title').hide()}
Popover.prototype.hasContent=function(){return this.getTitle()||this.getContent()}
Popover.prototype.getContent=function(){var $e=this.$element
var o=this.options
return $e.attr('data-content')||(typeof o.content=='function'?o.content.call($e[0]):o.content)}
Popover.prototype.arrow=function(){return(this.$arrow=this.$arrow||this.tip().find('.favth-arrow'))}
function Plugin(option){return this.each(function(){var $this=$(this)
var data=$this.data('bs.favth-popover')
var options=typeof option=='object'&&option
if(!data&&/destroy|hide/.test(option))return
if(!data)$this.data('bs.favth-popover',(data=new Popover(this,options)))
if(typeof option=='string')data[option]()})}
$.fn.favthpopover=Plugin
$.fn.favthpopover.Constructor=Popover}(jQuery);+function($){'use strict';function ScrollSpy(element,options){this.$body=$(document.body)
this.$scrollElement=$(element).is(document.body)?$(window):$(element)
this.options=$.extend({},ScrollSpy.DEFAULTS,options)
this.selector=(this.options.target||'')+' .nav li > a'
this.offsets=[]
this.targets=[]
this.activeTarget=null
this.scrollHeight=0
this.$scrollElement.on('scroll.bs.favth-scrollspy',$.proxy(this.process,this))
this.refresh()
this.process()}
ScrollSpy.VERSION='3.3.7'
ScrollSpy.DEFAULTS={offset:10}
ScrollSpy.prototype.getScrollHeight=function(){return this.$scrollElement[0].scrollHeight||Math.max(this.$body[0].scrollHeight,document.documentElement.scrollHeight)}
ScrollSpy.prototype.refresh=function(){var that=this
var offsetMethod='offset'
var offsetBase=0
this.offsets=[]
this.targets=[]
this.scrollHeight=this.getScrollHeight()
if(!$.isWindow(this.$scrollElement[0])){offsetMethod='position'
offsetBase=this.$scrollElement.scrollTop()}
this.$body.find(this.selector).map(function(){var $el=$(this)
var href=$el.data('target')||$el.attr('href')
var $href=/^#./.test(href)&&$(href)
return($href&&$href.length&&$href.is(':visible')&&[[$href[offsetMethod]().top+offsetBase,href]])||null}).sort(function(a,b){return a[0]-b[0]}).each(function(){that.offsets.push(this[0])
that.targets.push(this[1])})}
ScrollSpy.prototype.process=function(){var scrollTop=this.$scrollElement.scrollTop()+this.options.offset
var scrollHeight=this.getScrollHeight()
var maxScroll=this.options.offset+scrollHeight-this.$scrollElement.height()
var offsets=this.offsets
var targets=this.targets
var activeTarget=this.activeTarget
var i
if(this.scrollHeight!=scrollHeight){this.refresh()}
if(scrollTop>=maxScroll){return activeTarget!=(i=targets[targets.length-1])&&this.activate(i)}
if(activeTarget&&scrollTop<offsets[0]){this.activeTarget=null
return this.clear()}
for(i=offsets.length;i--;){activeTarget!=targets[i]&&scrollTop>=offsets[i]&&(offsets[i+1]===undefined||scrollTop<offsets[i+1])&&this.activate(targets[i])}}
ScrollSpy.prototype.activate=function(target){this.activeTarget=target
this.clear()
var selector=this.selector+'[data-target="'+target+'"],'+
this.selector+'[href="'+target+'"]'
var active=$(selector).parents('li').addClass('favth-active')
if(active.parent('.favth-dropdown-menu').length){active=active.closest('li.favth-dropdown').addClass('favth-active')}
active.trigger('activate.bs.favth-scrollspy')}
ScrollSpy.prototype.clear=function(){$(this.selector).parentsUntil(this.options.target,'.active').removeClass('favth-active')}
function Plugin(option){return this.each(function(){var $this=$(this)
var data=$this.data('bs.favth-scrollspy')
var options=typeof option=='object'&&option
if(!data)$this.data('bs.favth-scrollspy',(data=new ScrollSpy(this,options)))
if(typeof option=='string')data[option]()})}
$.fn.favthscrollspy=Plugin
$.fn.favthscrollspy.Constructor=ScrollSpy
$(window).on('load.bs.favth-scrollspy.data-api',function(){$('[data-spy="favth-scroll"]').each(function(){var $spy=$(this)
Plugin.call($spy,$spy.data())})})}(jQuery);+function($){'use strict';var Tab=function(element){this.element=$(element)}
Tab.VERSION='3.3.7'
Tab.TRANSITION_DURATION=150
Tab.prototype.show=function(){var $this=this.element
var $ul=$this.closest('ul:not(.favth-dropdown-menu)')
var selector=$this.data('target')
if(!selector){selector=$this.attr('href')
selector=selector&&selector.replace(/.*(?=#[^\s]*$)/,'')}
if($this.parent('li').hasClass('favth-active'))return
var $previous=$ul.find('.favth-active:last a')
var hideEvent=$.Event('hide.bs.favth-tab',{relatedTarget:$this[0]})
var showEvent=$.Event('show.bs.favth-tab',{relatedTarget:$previous[0]})
$previous.trigger(hideEvent)
$this.trigger(showEvent)
if(showEvent.isDefaultPrevented()||hideEvent.isDefaultPrevented())return
var $target=$(selector)
this.activate($this.closest('li'),$ul)
this.activate($target,$target.parent(),function(){$previous.trigger({type:'hidden.bs.favth-tab',relatedTarget:$this[0]})
$this.trigger({type:'shown.bs.favth-tab',relatedTarget:$previous[0]})})}
Tab.prototype.activate=function(element,container,callback){var $active=container.find('> .favth-active')
var transition=callback&&$.support.transition&&($active.length&&$active.hasClass('favth-fade')||!!container.find('> .favth-fade').length)
function next(){$active.removeClass('favth-active').find('> .favth-dropdown-menu > .favth-active').removeClass('favth-active').end().find('[data-toggle="favth-tab"]').attr('aria-expanded',false)
element.addClass('favth-active').find('[data-toggle="favth-tab"]').attr('aria-expanded',true)
if(transition){element[0].offsetWidth
element.addClass('favth-in')}else{element.removeClass('favth-fade')}
if(element.parent('.favth-dropdown-menu').length){element.closest('li.favth-dropdown').addClass('favth-active').end().find('[data-toggle="favth-tab"]').attr('aria-expanded',true)}
callback&&callback()}
$active.length&&transition?$active.one('bsTransitionEnd',next).emulateTransitionEnd(Tab.TRANSITION_DURATION):next()
$active.removeClass('favth-in')}
function Plugin(option){return this.each(function(){var $this=$(this)
var data=$this.data('bs.favth-tab')
if(!data)$this.data('bs.favth-tab',(data=new Tab(this)))
if(typeof option=='string')data[option]()})}
$.fn.favthtab=Plugin
$.fn.favthtab.Constructor=Tab
var clickHandler=function(e){e.preventDefault()
Plugin.call($(this),'show')}
$(document).on('click.bs.favth-tab.data-api','[data-toggle="favth-tab"]',clickHandler).on('click.bs.favth-tab.data-api','[data-toggle="favth-pill"]',clickHandler)}(jQuery);+function($){'use strict';var Affix=function(element,options){this.options=$.extend({},Affix.DEFAULTS,options)
this.$target=$(this.options.target).on('scroll.bs.favth-affix.data-api',$.proxy(this.checkPosition,this)).on('click.bs.favth-affix.data-api',$.proxy(this.checkPositionWithEventLoop,this))
this.$element=$(element)
this.affixed=null
this.unpin=null
this.pinnedOffset=null
this.checkPosition()}
Affix.VERSION='3.3.7'
Affix.RESET='favth-affix favth-affix-top favth-affix-bottom'
Affix.DEFAULTS={offset:0,target:window}
Affix.prototype.getState=function(scrollHeight,height,offsetTop,offsetBottom){var scrollTop=this.$target.scrollTop()
var position=this.$element.offset()
var targetHeight=this.$target.height()
if(offsetTop!=null&&this.affixed=='top')return scrollTop<offsetTop?'top':false
if(this.affixed=='bottom'){if(offsetTop!=null)return(scrollTop+this.unpin<=position.top)?false:'bottom'
return(scrollTop+targetHeight<=scrollHeight-offsetBottom)?false:'bottom'}
var initializing=this.affixed==null
var colliderTop=initializing?scrollTop:position.top
var colliderHeight=initializing?targetHeight:height
if(offsetTop!=null&&scrollTop<=offsetTop)return'top'
if(offsetBottom!=null&&(colliderTop+colliderHeight>=scrollHeight-offsetBottom))return'bottom'
return false}
Affix.prototype.getPinnedOffset=function(){if(this.pinnedOffset)return this.pinnedOffset
this.$element.removeClass(Affix.RESET).addClass('favth-affix')
var scrollTop=this.$target.scrollTop()
var position=this.$element.offset()
return(this.pinnedOffset=position.top-scrollTop)}
Affix.prototype.checkPositionWithEventLoop=function(){setTimeout($.proxy(this.checkPosition,this),1)}
Affix.prototype.checkPosition=function(){if(!this.$element.is(':visible'))return
var height=this.$element.height()
var offset=this.options.offset
var offsetTop=offset.top
var offsetBottom=offset.bottom
var scrollHeight=Math.max($(document).height(),$(document.body).height())
if(typeof offset!='object')offsetBottom=offsetTop=offset
if(typeof offsetTop=='function')offsetTop=offset.top(this.$element)
if(typeof offsetBottom=='function')offsetBottom=offset.bottom(this.$element)
var affix=this.getState(scrollHeight,height,offsetTop,offsetBottom)
if(this.affixed!=affix){if(this.unpin!=null)this.$element.css('top','')
var affixType='affix'+(affix?'-'+affix:'')
var e=$.Event(affixType+'.bs.favth-affix')
this.$element.trigger(e)
if(e.isDefaultPrevented())return
this.affixed=affix
this.unpin=affix=='bottom'?this.getPinnedOffset():null
this.$element.removeClass(Affix.RESET).addClass('favth-'+affixType).trigger(affixType.replace('affix','affixed')+'.bs.favth-affix')}
if(affix=='bottom'){this.$element.offset({top:scrollHeight-height-offsetBottom})}}
function Plugin(option){return this.each(function(){var $this=$(this)
var data=$this.data('bs.favth-affix')
var options=typeof option=='object'&&option
if(!data)$this.data('bs.favth-affix',(data=new Affix(this,options)))
if(typeof option=='string')data[option]()})}
$.fn.favthaffix=Plugin
$.fn.favthaffix.Constructor=Affix
$(window).on('load',function(){$('[data-spy="favth-affix"]').each(function(){var $spy=$(this)
var data=$spy.data()
data.offset=data.offset||{}
if(data.offsetBottom!=null)data.offset.bottom=data.offsetBottom
if(data.offsetTop!=null)data.offset.top=data.offsetTop
Plugin.call($spy,data)})})}(jQuery);

/*------ script-min.js ------*/
!function(a){a.fn.speasyimagegallery=function(b){var c={showCounter:!0,showTitle:!0,showDescription:!0,parent:".speasyimagegallery-gallery"};this.each(function(){b&&a.extend(c,b);var d=this,e=function(){this.items=a(d).closest(c.parent).find(d.nodeName),this.count=this.items.length-1,this.index=this.items.index(d),this.navPrev="",this.navNext="",this.loaded=!1,this.naturalWidth=0,this.naturalHeight=0,this.init=function(){this.modal(),this.goto(this.index);var b=this;this.navNext.on("click",function(a){a.preventDefault(),b.next()}),a(document).on("click",".speasyimagegallery-image",function(a){a.preventDefault(),b.next()}),a(document).on("click",".speasyimagegallery-modal-wrapper, .speasyimagegallery-close",function(a){a.target===this&&(a.preventDefault(),b.close())}),a(document).on("keyup",function(a){39==a.keyCode&&(a.preventDefault(),b.next()),37==a.keyCode&&(a.preventDefault(),b.prev()),27==a.keyCode&&(a.preventDefault(),b.close())}),this.navPrev.on("click",function(a){a.preventDefault(),b.prev()}),a(window).on("resize",function(){var c=b.resize();a(".speasyimagegallery-modal").css({width:c.width,height:c.height})})},this.modal=function(){a('<div id="speasyimagegallery-modal" class="speasyimagegallery-modal-wrapper"><a href="#" class="speasyimagegallery-prev"><span></span></a><a href="#" class="speasyimagegallery-next"><span></span></a><div class="speasyimagegallery-modal"><a href="#" class="speasyimagegallery-close speasyimagegallery-hidden">&times;</a><div class="speasyimagegallery-modal-body"></div></div></div>').appendTo(a("body").addClass("speasyimagegallery-modal-open")),this.modal=a("#speasyimagegallery-modal"),this.navNext=this.modal.find(".speasyimagegallery-next"),this.navPrev=this.modal.find(".speasyimagegallery-prev")},this.close=function(){this.index=0,this.loaded=!0,this.naturalWidth=0,this.naturalHeight=0,a("#speasyimagegallery-modal").fadeOut(function(){a(this).remove()}),a(".speasyimagegallery-modal").animate({width:100,height:100},300,function(){a(this).remove(),a("body").removeClass("speasyimagegallery-modal-open")})},this.resize=function(){var b=a(window).width()-80,c=a(window).height()-80,d=0,e=this.naturalWidth,f=this.naturalHeight;return e>b&&(d=b/e,f*=d,e*=d),f>c&&(d=c/f,e*=d,f*=d),{width:e,height:f}},this.next=function(){this.index<this.count?this.index=this.index+1:this.index=0,this.goto(this.index)},this.prev=function(){this.index>0?this.index=this.index-1:this.index=this.count,this.goto(this.index)},this.goto=function(b){if(this.loaded===!1){var d=this,e=a(this.items[b]);d.loaded=!0,a(".speasyimagegallery-modal-body").html('<div class="speasyimagegallery-gallery-loading"></div>');var f=a("<img />").attr("src",e.attr("href")).on("load",function(){if(this.complete&&"undefined"!=typeof this.naturalWidth&&0!=this.naturalWidth){d.naturalWidth=this.naturalWidth,d.naturalHeight=this.naturalHeight;var b=d.resize();a(".speasyimagegallery-modal").animate({width:b.width,height:b.height},300,function(){var b='<div class="speasyimagegallery-image-wrapper">';b+='<img class="speasyimagegallery-image" src="'+f[0].src+'" alt="'+e.attr("data-alt")+'">',(c.showCounter||c.showTitle&&e.attr("data-title")||c.showDescription&&e.attr("data-desc"))&&(e.attr("data-title")||e.attr("data-description"))&&(b+='<div class="speasyimagegallery-image-content">',c.showCounter&&(b+='<span class="speasyimagegallery-gallery-stat">'+(d.index+1)+" of "+(d.count+1)+"</span>"),c.showTitle&&e.attr("data-title")&&(b+='<span class="speasyimagegallery-image-title">'+e.attr("data-title")+"</span>"),c.showDescription&&e.attr("data-desc")&&(b+='<div class="speasyimagegallery-image-description">'+e.attr("data-desc")+"</div>"),b+="</div>"),b+="</div>",a(".speasyimagegallery-modal-body").html(b),d.modal.find(".speasyimagegallery-hidden").removeClass("speasyimagegallery-hidden"),d.loaded=!1})}else;})}}};(new e).init()})}}(jQuery);

/*------ speasygallery-main.js ------*/
;(function($){$(document).on('click','.speasyimagegallery-gallery-item',function(event){event.preventDefault();var spdata=$(this).closest('.speasyimagegallery-gallery');$(this).speasyimagegallery({showTitle:spdata.data('showtitle'),showDescription:spdata.data('showdescription'),showCounter:spdata.data('showcounter')});});})(jQuery);

/*------ main.js ------*/
jQuery(window).on('load',function(){if(jQuery('.sp-loader-with-logo').length>0){move();}
jQuery('.sp-pre-loader').fadeOut(500,function(){jQuery(this).remove();});});function move(){var elem=document.getElementById('line-load');var width=1;var id=setInterval(frame,10);function frame(){if(width>=100){clearInterval(id);}else{width++;elem.style.width=width+'%';}}}
jQuery(function($){var settings=Joomla.getOptions('data')||{};var handleStickiness=function(className,offsetTop){if($('body:not(.layout-edit-iframe)').hasClass(className)){var $header=$('#sp-header');var headerHeight=$header.outerHeight();var $stickyHeaderPlaceholder=$('.sticky-header-placeholder');let $stickyOffset='100';if(settings.header!==undefined&&settings.header.stickyOffset!==undefined){$stickyOffset=settings.header.stickyOffset||'100';}
var stickyHeader=function(){var scrollTop=$(window).scrollTop();if(scrollTop>=offsetTop+Number($stickyOffset)){$header.addClass('header-sticky');$stickyHeaderPlaceholder.height(headerHeight);}else{if($header.hasClass('header-sticky')){$header.removeClass('header-sticky');$stickyHeaderPlaceholder.height('inherit');}}};stickyHeader();$(window).scroll(function(){stickyHeader();});if($('body').hasClass('layout-boxed')){var windowWidth=$header.parent().outerWidth();$header.css({'max-width':windowWidth,left:'auto'});}}else{var $header=$('#sp-header');if($header.hasClass('header-sticky')){$header.removeClass('header-sticky');}
$(window).off('scroll');}};function getHeaderOffset(){let $header=$('#sp-header');let stickyHeaderTop=$header.offset().top;let $backHeader=$('body.back-panel').find('#sp-header');let backPanelStickyHeaderTop=null;if($backHeader.length>0){backPanelStickyHeaderTop=$backHeader.offset().top;}
let headerOffset=stickyHeaderTop;if(backPanelStickyHeaderTop!==null){headerOffset=backPanelStickyHeaderTop-settings.topbarHeight;headerOffset=headerOffset<0?stickyHeaderTop:headerOffset;}
return headerOffset;}
const headerExist=$('#sp-header');if(headerExist.length>0){handleStickiness('sticky-header',getHeaderOffset());}
$(window).scroll(function(){if($(this).scrollTop()>100){$('.sp-scroll-up').fadeIn();}else{$('.sp-scroll-up').fadeOut(400);}});$('.sp-scroll-up').click(function(){$('html, body').animate({scrollTop:-60,},600);return false;});$('.sp-megamenu-wrapper').parent().parent().css('position','static').parent().css('position','relative');$('.sp-menu-full').each(function(){$(this).parent().addClass('menu-justify');});$('#offcanvas-toggler').on('click',function(event){event.preventDefault();$('.offcanvas-init').addClass('offcanvas-active');});$('.offcanvas-toggler-secondary').on('click',function(event){event.preventDefault();$('.offcanvas-init').addClass('offcanvas-active');});$('.offcanvas-toggler-full').on('click',function(event){event.preventDefault();$('.offcanvas-init').addClass('offcanvas-active full-offcanvas');});$('.close-offcanvas, .offcanvas-overlay').on('click',function(event){event.preventDefault();$('.offcanvas-init').removeClass('offcanvas-active full-offcanvas');});$(document).on('click','.offcanvas-inner .menu-toggler',function(event){event.preventDefault();$(this).closest('.menu-parent').toggleClass('menu-parent-open').find('>.menu-child').slideToggle(400);});if($('#modal-menu').length>0){let $modalToggler=$('#modal-menu-toggler');let $modalMenu=$('#modal-menu');let $body=$('body');$modalToggler.on('click',function(e){e.preventDefault();$modalMenu.toggleClass('active');$body.toggleClass('modal-menu-active');$(this).toggleClass('active');});$(document).keyup(function(e){if(e.key=='Escape'){$modalMenu.removeClass('active');$modalToggler.removeClass('active');$body.removeClass('modal-menu-active');}});}
const tooltipTriggerList=[].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"], .hasTooltip'));tooltipTriggerList.map(function(tooltipTriggerEl){return new bootstrap.Tooltip(tooltipTriggerEl,{html:true});});const popoverTriggerList=[].slice.call(document.querySelectorAll('[data-bs-toggle="popover"], .hasPopover'));popoverTriggerList.map(function(popoverTriggerEl){return new bootstrap.Popover(popoverTriggerEl);});$('.article-ratings .rating-star').on('click',function(event){event.preventDefault();var $parent=$(this).closest('.article-ratings');var request={option:'com_ajax',template:template,action:'rating',rating:$(this).data('number'),article_id:$parent.data('id'),format:'json',};$.ajax({type:'POST',data:request,beforeSend:function(){$parent.find('.fa-spinner').show();},success:function(response){var data=$.parseJSON(response);$parent.find('.ratings-count').text(data.message);$parent.find('.fa-spinner').hide();if(data.status){$parent.find('.rating-symbol').html(data.ratings);}
setTimeout(function(){$parent.find('.ratings-count').text('('+data.rating_count+')');},3000);},});});$('.sp-cookie-allow').on('click',function(event){event.preventDefault();var date=new Date();date.setTime(date.getTime()+30*24*60*60*1000);var expires='; expires='+date.toGMTString();document.cookie='spcookie_status=ok'+expires+'; path=/';$(this).closest('.sp-cookie-consent').fadeOut();});$('.btn-group label:not(.active)').click(function(){var label=$(this);var input=$('#'+label.attr('for'));if(!input.prop('checked')){label.closest('.btn-group').find('label').removeClass('active btn-success btn-danger btn-primary');if(input.val()===''){label.addClass('active btn-primary');}else if(input.val()==0){label.addClass('active btn-danger');}else{label.addClass('active btn-success');}
input.prop('checked',true);input.trigger('change');}
var parent=$(this).parents('#attrib-helix_ultimate_blog_options');if(parent){showCategoryItems(parent,input.val());}});$('.btn-group input[checked=checked]').each(function(){if($(this).val()==''){$('label[for='+$(this).attr('id')+']').addClass('active btn btn-primary');}else if($(this).val()==0){$('label[for='+$(this).attr('id')+']').addClass('active btn btn-danger');}else{$('label[for='+$(this).attr('id')+']').addClass('active btn btn-success');}
var parent=$(this).parents('#attrib-helix_ultimate_blog_options');if(parent){parent.find('*[data-showon]').each(function(){$(this).hide();});}});function showCategoryItems(parent,value){var controlGroup=parent.find('*[data-showon]');controlGroup.each(function(){var data=$(this).attr('data-showon');data=typeof data!=='undefined'?JSON.parse(data):[];if(data.length>0){if(typeof data[0].values!=='undefined'&&data[0].values.includes(value)){$(this).slideDown();}else{$(this).hide();}}});}
$(window).on('scroll',function(){var scrollBar=$('.sp-reading-progress-bar');if(scrollBar.length>0){var s=$(window).scrollTop(),d=$(document).height(),c=$(window).height();var scrollPercent=(s /(d-c))*100;const position=scrollBar.data('position');if(position==='top'){}
scrollBar.css({width:`${scrollPercent}%`});}});var observer=new MutationObserver(function(mutations){$('#system-message-container .alert .close').attr('data-bs-dismiss','alert');});var target=document.querySelector('#system-message-container');observer.observe(target,{attributes:true});});

