const { cache } = require("react");

(function($) {

	"use strict";

	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
  });

})(jQuery);


// ------------------------------------------------ 	Multi Dynamic Chat Application  ------------------------------------------------

function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}

	let userData = JSON.parse(getCookie('user'));
	console.log('Cookie Data:', userData); 
    let sender_id = userData._id;
    let receiver_id = '';
    let global_group_id;
    let socket = io('/user-namespace', {
        auth:{
            token: userData._id
        }
    });

    $(document).ready(function(){

        $('.users-list').click(function(){

           let userId = $(this).attr('data-id');
            receiver_id = userId; 

            $('.start-head').hide();
            $('.chat-section').show();

            socket.emit('existingChat', {sender_id: sender_id, receiver_id: receiver_id});
        });

    });

    //update user online status

    socket.on('getOnlineUser', function(data){
        $('#'+data.userId+'-status').text('Online');
        $('#'+data.userId+'-status').removeClass('offline-status');
        $('#'+data.userId+'-status').addClass('online-status'); 
    });



    //update user offline status

    socket.on('getOfflineUser', function(data){
        $('#'+data.userId+'-status').text('Offline');
        $('#'+data.userId+'-status').removeClass('online-status');
        $('#'+data.userId+'-status').addClass('offline-status'); 
    });

    //save the chat of the user
    $('#chat-form').submit(function(event){
        event.preventDefault();
        
        let message = $('#message').val();
        $.ajax({
            url: '/save-chat',
            type: 'POST',
            data:{
                sender_id: sender_id,
                receiver_id: receiver_id,
                message: message,
                                
            },
            success: function(response){
                    if(response.success){
                        $('#message').val('');
                        let chat = response.data.message;
                        let html = `<div class="current-user-chat" id="`+response.data._id +`">
                                        <h5>
                                           <span> `+ chat +` <span>
                                            <i class="fa fa-trash" aria-hidden="true" data-id="`+ response.data._id +`" data-toggle="modal" data-bs-target="#deleteModal"> </i>
                                            <i class="fa fa-edit" aria-hidden="true" data-id="`+ response.data._id +`" data-msg='`+response.data.message+`' data-bs-target="#updateChatModal"> </i>
                                        </h5>
                                    </div>`;
                        $('#chat-container').append(html);
                        socket.emit('newChat',response.data); 
                        scrollChat();
                    }
                    else{
                        alert(response.msg);
                    }
                }
    });
});
    socket.on('loadNewChat', function(data){
        if(sender_id === data.receiver_id && receiver_id === data.sender_id){
                 let html = `<div class="distance-user-chat" id="`+ data.sender_id +`">
                        <h5>
                           <span>`+ data.message +`</span>
                        </h5>
                    </div>`;
        $('#chat-container').append(html);

        }
            scrollChat();
   
    });

    //load existing chat
    socket.on('loadChats', function(data){
    $('#chat-container').html('');
    let chats = data.chats;

    for(let x = 0; x < chats.length; x++){
        let addClass = chats[x]['sender_id'] == sender_id ? 'current-user-chat' : 'distance-user-chat';
        
        let html = `<div class="${addClass}" id="${chats[x]['_id']}">
                        <h5><span>${chats[x]['message']}</span>`;
        
        if(chats[x]['sender_id'] == sender_id){
            html += `<i class="fa fa-trash" data-id="${chats[x]['_id']}" data-toggle="modal" data-target="#deleteChatModal"></i>
                     <i class="fa fa-edit" data-id="${chats[x]['_id']}" data-msg="${chats[x]['message']}" data-target="#updateChatModal"></i>`;
        }
        
        html += `</h5></div>`;
        $('#chat-container').append(html);  // inside loop
    }
    scrollChat();  // outside loop is fine
});        
               
                        
    function scrollChat(){
        $('#chat-container').animate({
            scrollTop: $('#chat-container').offset().top + $('#chat-container')[0].scrollHeight
        },0);
    }

    //delete chat
    $(document).on('click', '.fa-trash', function(){
        let mesg = $(this).parent().text();
        $('#delete-message').text(mesg);

        $('#delete-message-id').val($(this).attr('data-id'));
    
    });

    $('#deleteChatModal form').submit(function(event){
        event.preventDefault();
        let id = $('#delete-message-id').val();
        $.ajax({
            url: '/delete-chat',
            type: 'POST',
            data:{
                chatId: id,
                
            },
            success: function(res){
                    if(res.success){
                        $('#'+id).remove();
                        $('#deleteChatModal').modal('hide');
                        socket.emit('chatDeleted',id);
                    }
                    else{
                        alert(res.msg);
                    }
                }
        });
    });

    socket.on('loadDeletedChat', function(id){
        $('#'+id).remove();
    });

    //update chat
    $(document).on('click', '.fa-edit', function(){
    $('#update-message-id').val($(this).attr('data-id')); 
    $('#update-message').val($(this).attr('data-msg'));
});

// submit handler standalone, outside click
$('#updateChatModal form').submit(function(event){
    event.preventDefault();
    let id = $('#update-message-id').val();
    let msg = $('#update-message').val();
    $.ajax({
        url: '/update-chat',
        type: 'POST',
        data: { chatId: id, message: msg },
        success: function(res){
            if(res.success){
                $('#updateChatModal').modal('hide');
                $('#'+id).find('span').text(msg);
                $('#'+id).find('.fa-edit').attr('data-msg', msg);
                socket.emit('chatUpdated', {chatId: id, message: msg});
            }
        }
    });
    });
     socket.on('loadUpdatedChat', function(data){
            $('#'+data.chatId).find('span').text(data.message);
            $('#'+data.chatId).find('.fa-edit').attr('data-msg', data.message);
        });


// add members in group chat

$('.addMember').click(function(){

	let id = $(this).attr('data-id');
	let limit = $(this).attr('data-limit');

	$('#group_id').val(id);
	$('#limit').val(limit);

	$.ajax({
		url:'/get-members',
		type:'POST',
		data:{group_id:id},
		success: function(res){
			if(res.success == true){
				let users = res.data;
				let html = '';

				for(let i = 0; i < users.length; i++){

                    let isMemberOfGroup = users[i]['member'].length > 0?true:false;

					html += `
							<tr>
								<td>
									<input type="checkbox" `+(isMemberOfGroup?'checked':'')+` name="members[]" value="`+users[i][_id]+`"/>
								</td>
								<td>`+users[i]['name']+`</td>
							</tr>
					`;
				}
				$('.addMembersInTable').html(html);
			}
			else{
				alert(res.msg);
			}
		}
	});
});


// add members form submit

$('#add-member-form').submit(function(event){
	event.preventDefault();
	let formData = $(this).serialize();

	$.ajax({
		url:"/add-members",
		type:"POST",
		data: formData,
		success: function(res){
			if (res.success) {
				alert(res.msg)
				$('#memberModal').modal('hide');
				$('#add-member-form')[0].reset();
				alert(res.msg);
			} else {
				$('#add-member-error').text(res.msg);
				setTimeout(()=>{
					$('#add-member-error').text(res.msg);
				},3000);
			}
		}
	});
});

// update group
$('.updateMember').click(function(){
    let obj = JSON.parse($(this).attr('data-obj'));

    $('#groupId').val(obj._id);
    $('#lastLimit').val(obj.limit);
    $('#groupName').val(obj.name);
    $('#groupLimit').val(obj.limit);
});

$('#updateChatGroupForm').submit(function(e){
    e.preventDefault();

    $.ajax({
        url:"/update-chat-group",
        type:"POST",
        data: new FormData(this),
        contentType: false,
        cache: false,
        processData: false,
        success:function(res){
            alert(res.msg);
            if(res.success){
                location.reload();
            }
        }
    });
});

//delete group
$('.deleteGroup').click(function(){
    $('#deleteGroupId').val($(this).attr('data-id'));
    $('#deleteGroupName').text($(this).attr('data-name'));

});

$('#deleteChatGroupForm').submit(function(e){
    e.preventDefault();

    let formData = $(this).serialize();

    $.ajax({
        url:"/delete-chat-group",
        type:"POST",
        data: formData,
        success:function(res){
            alert(res.msg);
            if(res.success){
                location.reload();
            }
        }
    })
});

// Copy/Shareable link
$('.copy').click(function(){
    $(this).prepend('<span class="copied_text">Copied</span>');
    
    let group_id = $(this).attr('data_id');

    let url = window.location.host+'/share-group'+group_id;

    let temp = $("<input");
    $("body").append(temp);
    temp.val(url).select();
    document.execCommand("copy");

    temp.remove();

    setTimeout(()=>{
        $('.copied_text').remove();
    
    },2000);
});

// join group through link
$('.join-now').click(function(){
    $(this).text('Wait...');
    $(this).attr('disabled', 'disabled');

    let group_id = $(this).attr('data-id');

    $.ajax({
        url:"/join-group",
        type:"POST",
        data:{ group_id: group_id},
        success: function(res){
            alert(res.msg);
            if(res.success){
                location.reload();
            }
            else{
                
                $(this).text('Join Now');
                $(this).removeAttr('disabled');
            }
        }
    });
});

// Group Chats
$('.group-list').click(function(){
    $('.group-start-head').hide();
    $('.group-chat-section').show();

    global_group_id = $(this).attr('data-id');

    loadGroupChats();
});

function scrollChat(){
        $('#group-chat-container').animate({
            scrollTop: $('#group-chat-container').offset().top + $('#group-chat-container')[0].scrollHeight
        },0);
    }

//save the chat of the group
    $('#group-chat-form').submit(function(event){
        event.preventDefault();
        
        let message = $('#group-message').val();
        $.ajax({
            url: '/group-chat-save',
            type: 'POST',
            data:{
                sender_id: sender_id,
                group_id: global_group_id,
                message: message,
                                
            },
            success: function(response){
                    if(response.success){

                        $('#group-message').val('');
                        let message = response.chat.message;
                        let html=`
                        <div class="current-user-chat" id='`+response.chat._id+`'>
                        <h5>
                            <span> `+message+` </span>
                            <i class="fa fa-trash" aria-hidden="true" data-id='`+response.chat._id+`' data-bs-toggle="modal" data-bs-target="deleteGroupChatModal"></i>
                            <i class="fa fa-edit" aria-hidden="true" data-id='`+response.chat._id+`'data-msg='`+message+`' data-bs-toggle="modal" data-bs-target="updateGroupChatModal"></i>

                        </h5>
                        </div>
                        `;
                        $('#group-chat-container').append(html);
                        socket.emit('newGroupChat', response.chat);
                        
                        scrollGroupChat();
                    }
                    else{
                        alert(response.msg);
                    }
                }
    });
});

socket.on('loadNewGroupChat', function(data){
    if(global_group_id == data.group_id){
        let html =`
                        <div class="current-user-chat" id='`+data._id+`'>
                        <h5>
                            <span> `+data.message+` </span>
                        </h5>
                        </div>
                        `;
                        $(#group-chat-container).append(html);

                        scrollChat();
    }
});

function loadGroupChats(){
    $.ajax({
        url:"/load-group-chats",
        type:"POST",
        data:{
            group_id: global_group_id
        },
        success:function(res){
            if(res.success){
                let chats = res.chats;
                let html = '';
                for(let i = 0; i< chats.length; i++){
                    let className = 'distance-user-chat';

                    if(chats[i]['sender_id'] == sender_id){
                        className = 'current-user-chat';
                    }

                    html += `
                        <div class="`+className+`" id='`+chats[i]['_id']+`'>
                            <h5>
                                <span> `+chats[i]['message']+` </span>`;

                                if(chats[i]['sender_id'] == sender_id){
                                 html +=`    <i class="fa fa-trash deleteGroupChat" aria-hidden="true" data-id='`+chats[i]['_id']+`' data-bs-toggle="modal" data-bs-target="deleteGroupChatModal"></i>                          
                                             <i class="fa fa-edit" aria-hidden="true" data-id='`+chats[i]['_id']+`'data-msg='`+chats[i]['message']+`' data-bs-toggle="modal" data-bs-target="updateGroupChatModal"></i>`;

                                }
                                                            
                            html +=`
                            </h5>
                        </div>
                    `;
                }

                $('#group-chat-container').html(html);
            }
            else{
                alert(res.msg);
            }
        }
    });
}

$(document).on('click','.deleteGroupChat', function(){
    let msg=$(this).parent().find('span').text();
    $('#delete-group-message').text(msg);
    $('#delete-group-message-id').val($(this).attr('data_id'));
});

$('#delete-group-chat-form').submit(function(e){
    e.preventDefault();

    let id = $('#delete-group-message-id').val();

    $.ajax({
        url:"/delete-group-chat",
        type : "POST",
        data : {id:id},
        success:function(){
            if(res.success){
                $('#'+id).remove();
                $('#deleteGroupChatModal').modal('hide');
                socket.emit('groupChatDeleted', id);
            }
            else{
                alert(res.msg);
            }
        }
    });
});

socket.on('groupChatMessageDeleted',function(id){
    $('#'+id).remove();
});

$(document).on('click','.updateGroupChat', function(){

    $('#update-group-message').val($(this).attr('data-id'));
    $('#update-group-message-id').val($(this).attr('data-msg'));
});
$('#update-group-chat-form').submit(function(e){
    e.preventDefault();

    let id = $('#update-group-message').val();
    let msg =  $('#update-group-message-id').val();


    $.ajax({
        url:"/update-group-chat",
        type : "POST",
        data : {id:id, message:msg},
        success:function(){
            if(res.success){
                
                $('#updateGroupChatModal').modal('hide');
                $('#'+id).find('span').text(msg);
                $('#'+id).find('.editGroupChat').attr('data-msg',msg);
                socket.emit('groupChatUPdated', {id:id, message: msg});
            }
            else{
                alert(res.msg);
            }
        }
    });
});


socket.on('groupChatMessageUpdated', function(){
    console.log('Fronte', data);
    $('#'+data.id).find('span').text(data.message);
});
