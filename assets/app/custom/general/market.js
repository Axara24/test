jQuery(document).ready(function(){
    
    
});
function subscription(uid , id , days){
    swal({
				title: "Оформить подписку на автора?",
				text: "",
				type: "success",
				showCancelButton: !0,
                cancelButtonText: "<span><i class='la la-thumbs-down'></i><span>Нет, спасибо</span></span>",
 				cancelButtonClass: "btn btn-secondary kt-btn kt-btn--pill kt-btn--icon",
                confirmButtonClass: "btn btn-danger kt-btn kt-btn--pill kt-btn--air kt-btn--icon",
				confirmButtonText: "<span><i class='la la-thumbs-up'></i><span>Да, конечно!</span></span>"
			}).then(function(t) {
				t.value && subscription_ajax(uid , id , days)
			});
    function subscription_ajax(uid , id , days){
    	jQuery.ajax({
            beforeSend: function () {
                swal({
                    title: "Оформляем подписку...",
                    text: "",
                    timer: 10e3,
                    onOpen: function() {
                        swal.showLoading()
                    }
                }).then(function(t) {
                    "timer" === t.dismiss
                })
		    },
		    complete: function () {
// 			swal("Подписка оформлена!")
		    },
            fail: function () {
			swal("Ошибка!", "Свяжитесь с администрацией сайта.", "error")
		    },
		    type: 'POST',
		    url: '/market/ajax?action=subscription',
		    data: {
			    'uid': uid,
			    'id': id,
			    'days': days
		    },
		    success: function (data) {
			    //alert(data);
                if(data == 'false'){
                    swal("Недостаточно средств!", "Для оформления подписки пополните счет.", "error")
                }else{
                    swal("Подписка оформлена!", "", "success");
                    jQuery( "#balance" ).text(data);
                }


		    }
		});
    }
}
async function forecast(uid , iid , forecast_cost ){
    if(uid == 0){
        const {value: email} = await Swal.fire({
            showCancelButton: true,
            cancelButtonText: 'Отмена',
            confirmButtonText: 'Далее &rarr;',
        title: 'Купить прогноз за ' + forecast_cost + ' руб.',
        text: "На указанный email, после успешной оплаты будет отправлен прогноз.",
        input: 'email',
        inputPlaceholder: 'Введите ваш email'
        })

        if (email) {
            const {value: ps} = await Swal.fire({
            showCancelButton: true,
            cancelButtonText: 'Отмена',
            confirmButtonText: 'Перейти к оплате &rarr;',
            title: 'Выбор платежной системы',
            input: 'select',
            inputOptions: {
                'yd': 'Яндекс Деньги',
                'wmr': 'Web Money',
                'ik': 'Интеркасса'
            },
            inputPlaceholder: 'Выбор',
            showCancelButton: true,
            cancelButtonText: 'Отмена',
            inputValidator: (value) => {
                return new Promise((resolve) => {
                if (value === '') {
                    resolve('Выберите хотя бы одну платежную систему')
                } else {
                    resolve()
                }
                })
            }
            })

            if (ps) {
                Swal.fire({
                    showCancelButton: true,
                    cancelButtonText: 'Отмена',
                    title: 'Все готово',
                    html:
                        'Email: ' + email + ' Платежная система: ' + ps,
                    confirmButtonText: 'Оплатить прогноз'
                })
            }
        }

    }else{
           swal({
				title: 'Купить прогноз за ' + forecast_cost + ' btn.',
				text: '',
				type: 'success',
				showCancelButton: !0,
                cancelButtonText: "<span><i class='la la-thumbs-down'></i><span>Нет, спасибо</span></span>",
 				cancelButtonClass: "btn btn-secondary kt-btn kt-btn--pill kt-btn--icon",
                confirmButtonClass: "btn btn-danger kt-btn kt-btn--pill kt-btn--air kt-btn--icon",
				confirmButtonText: "<span><i class='la la-thumbs-up'></i><span>Да, конечно!</span></span>"
			}).then(function(t) {
				t.value && forecast_ajax( uid , iid )
			});
    }
    function forecast_ajax( uid , iid ){
        jQuery.ajax({
            beforeSend: function () {
                swal({
                    title: "Оформляем покупку прогноза...",
                    text: "",
                    timer: 10e3,
                    onOpen: function() {
                        swal.showLoading()
                    }
                }).then(function(t) {
                    "timer" === t.dismiss
                })
		    },
		    complete: function () {
		    },
            fail: function () {
			swal("Ошибка!", "Свяжитесь с администрацией сайта.", "error")
		    },
		    type: 'POST',
		    url: '/market/ajax?action=forecast',
		    data: {
			    'uid': uid,
			    'iid': iid
		    },
		    success: function (data) {
                if(data == 'false'){
                    swal("Недостаточно средств!", "Для покупки прогноза пополните счет.", "error")
                }else{
                    swal("Покупка прогноза успешно завершена!", "", "success");
                    jQuery( "#balance" ).text(data);
                }
		    }
		});
        
    }
}
