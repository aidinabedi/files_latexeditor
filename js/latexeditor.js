
$(document).ready(function () {
	//$("a#owncloud img").attr('src','/themes/coulomb/core/img/L2cCloud.png');
	//$("a#owncloud img").attr('style','max-height:32px');
	var files_latexeditor_js_done = false;
	$('#content #controls').bind('DOMNodeInserted', function(event) {
		if( $("#content #editor").length ) { // Editor exists
			// But control bar is finished only when the editor is filled
        		$("#content #editor").bind('DOMNodeInserted', function(event2){
            			if(files_latexeditor_js_done || !$("#editor_save").length )
                			return;
				if(isLatex($('#content #controls .last a').html())) {
					var latexbutton = '<button id="editor_compile">'+t('files_latexeditor','LaTex')+'</button><div class="separator"></div>';
					$('#editor_save').after(latexbutton);
					$('#content').on('click', '#editor_compile', doCompile);
					files_latexeditor_js_done = true;
				} else
					files_latexeditor_js_done = false;
        		});
    		} else 
			files_latexeditor_js_done = false;
	});
});

function isLatex(filename){
    //return $('#isPublic').val() && (getFileExtension(filename)=='tex'||getFileExtension(filename)=='latex');
    return getFileExtension(filename)=='tex'||getFileExtension(filename)=='latex';
}


function AjaxCompile(ajaxpath, path,filename,pdflatex){
    var jqxhr = $.ajax({
        type: 'POST',
        url: ajaxpath,
        data: {
            path:path,
            filename:filename,
            /* pdflatex:pdflatex?1:0 */
            compiler:pdflatex
        },
        dataType: 'json',
        global: false,
        async:false,
        beforeSend: function (  ) {
          doFileSave();
        },
        success: function(jsondata) {
            if(jsondata.status!='success'){
                $(":button:contains('ViewPdf')").button('disable');

            } else {
                // Compile OK
                // Update titles                                                    
                $(":button:contains('ViewPdf')").button('enable');
            }
            return jsondata;
        }
    }).responseText;

    jqxhr=jQuery.parseJSON(jqxhr);

    return jqxhr;
}

function compileFile(filename,path){

    //var message="Dir: "+path+" \nFilename: "+filename;

    var is_compiled = false;
    var ajaxpath=OC.filePath('files_latexeditor','ajax','compile.php');
    var pdffile="";
    var data="";

    DestroIfExist("dialogcompile");
    var compileDlg=$('<div id="dialogcompile"  title="'+'Compiling:'+ path+filename +'"><div id="latexresult" class="" style="width:98%;height:98%;">'+t('files_latexeditor',"Choose the compiler and click on 'Compile'...")+'</div></div>').dialog({
        modal: false,
        open: function(e, ui) {
            $(e.target).parent().find('span').filter(function(){
                return $(this).text() === 'dummy';
            }).parent().replaceWith('<select id="compiler" name ="compiler" ><option value="latex">LaTeX</option><option value="pdflatex">PDFLaTeX</option></select>');
        },
        buttons: {
            'dummy': function(e){
            },
            Compile: function(){

    		is_compiled = true;
                $('#latexresult').html("Compiling...");
                //json=AjaxCompile(ajaxpath,path, filename,$('#pdflatex').is(':checked'));
                json=AjaxCompile(ajaxpath,path, filename,$('#compiler').val());
                if(json){
                    //alert(json.data.output);
                    $('#latexresult').html("");
                    if(json.data.message){
                        $('#latexresult').html(json.data.message);
                        // $('#latexresult').addClass('ui-state-error');
                        $('#latexresult').css({
                            color:"red"
                        });
                    }
                    else{
                        $('#latexresult').removeClass('ui-state-error');
                        $('#latexresult').css({
                            color:"darkblue"
                        });

                    }

                    $('#latexresult').append(json.data.output);

                }

            },
	    ViewPdf: function(){
                //console.log('width:'+$(this).width()*0.9+';height:'+$(this).height()*0.8);                
                //var pdfviewerpath = oc_webroot + "/?app=files_pdfviewer&getfile=viewer.php&dir="+json.data.path+"&file="+json.data.pdffile;
		var pdfviewerpath = OC.linkTo('files_pdfviewer', 'viewer.php')+'?dir='+encodeURIComponent(json.data.path).replace(/%2F/g, '/')+'&file='+encodeURIComponent(json.data.pdffile);
                //var pdfviewerpath="http://www.google.com";
                //alert('PDF URL = '+pdfviewerpath);

                frame='<iframe id="latexresultpdf"  style="width:100%;height:100%;display:block;"></iframe>';
                $('#latexresult').html(frame).promise().done(function(){

                    $('#latexresultpdf').attr('src',pdfviewerpath);
                    //alert("Done");
                });

            },
            Close: function() {
                $( this ).dialog( "close" );
		if ( is_compiled )
			window.location.reload();
            }
        }
    })


    //console.log($('#editor').position());
    //console.log($('#editor').offset());
    x=$('#editor').position().left+$('#editor').width()*0.45;
    y=$('#editor').position().top+10;
    compileDlg.dialog({
        width:$('#editor').width()*0.5,
        height:$('#editor').height()*0.85,
        position: [x, y]
    });


    $(":button:contains('ViewPdf')").button('disable');
    //reopenEditor();
}


//Tries to compile The file
function doCompile(){
    if(editorIsShown()){

        var filename = $('#editor').attr('data-filename');
        var dir=$('#editor').attr('data-dir')+'/';

        compileFile(filename, dir);
    }
}

function DestroIfExist(idname)
{
    if(document.getElementById(idname)) {
        $("#"+idname).remove();
    }
}

