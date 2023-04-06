class Compile{
    constructor(el, vm) {
        this.$el = document.querySelector(el); // 要遍历的宿主节点
        this.$vm = vm;

        // 判断el
        if(this.$el) {
            this.$fragment = this.node2Fragment(this.$el); // 转换内部的内容为片段Fragment
            // 执行编译过程
            this.compile(this.$fragment);
            // 将编译完的结果追加到$el
            this.$el.appendChild(this.$fragment);
        } else {
            console.log('no el dom')
        }
    }
    // 将宿主元素中代码片段拿出来遍历，这样比较高效
    node2Fragment(el) {
        const frag = document.createDocumentFragment(); // 文档片段
        let child;
        while(child = el.firstChild) {
            frag.appendChild(child); // appendChild移动node挂到新的父元素末尾
        }
        return frag;
    }
    compile(el) {
        const childNodes = el.childNodes;
        Array.from(childNodes).forEach(node => {
            // 类型判断
            if(this.isElement(node)) {
                // 元素
                console.log('编译元素：', node.nodeName);
                // 找到元素内的k-xxx或者@click等‘元素’
                const nodeAttrs = node.attributes;
                Array.from(nodeAttrs).forEach(attr => {
                    const attrName = attr.name;
                    let exp = attr.value; // 属性值
                    if (this.isDirective(attrName)) {
                        // 如果是指令 k-text; k-model;k-html
                        const dir = attrName.substring(2); // 具体指令类型
                        this[dir] && this[dir](node, this.$vm, exp);
                    }
                    if (this.isEvent(attrName)) {
                        // 如果是事件
                        const eventType = attrName.substring(1); // @click
                        console.log('event type:', eventType);
                        const reg = /(\w+)(\(\))?/
                        if(reg.test(exp)) {
                            exp = RegExp.$1;
                        }
                        this.eventHandler(node, this.$vm, exp, eventType)
                    }
                })
            } else if(this.isInterpolation(node)){
                // 文本
                // console.log('编译文本：', node.textContent);
                this.compileText(node);
            }
            // 递归子节点
            if(node.childNodes && node.childNodes.length > 0) {
                this.compile(node);
            }
        })
    }
    isElement(node) {
        return node.nodeType === 1;
    }

    // 插值绑定，文本
    isInterpolation(node) {
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
    }
    // 
    compileText(node) {
        this.update(node, this.$vm, RegExp.$1, 'text');
    }

    // 更新函数
    // node: current node；vm: vue instance; exp: varible name; dir: node type, text or others;
    update(node, vm, exp, dir) {
        const updateFn = this[dir + 'Updater'];
        // 首次时候更新
        updateFn && updateFn(node, vm[exp]);
        // 需要监听变化，即依赖收集
        new Watcher(vm, exp, function(value) {
            updateFn && updateFn(node, value);
        })
    }

    // 文本node更新
    textUpdater(node, value) {
        console.log('textUpdater:', value);
        node.textContent = value;
    }

    //节点判断
    isDirective(attr) {
        return attr.indexOf('k-') === 0;
    }
    isEvent(attr) {
        return attr.indexOf('@') === 0;
    }
    // k-text处理
    text(node, vm, exp) {
        this.update(node, vm, exp, 'text');
    }
    // 双向绑定处理 k-model
    model(node, vm, exp) {
        this.update(node, vm, exp, 'model');
        node.addEventListener('input', e=> {
            vm[exp] = e.target.value;
        });
    }
    modelUpdater(node, value) {
        node.value = value; // input的value
    }
    // html
    html(node, vm, exp) {
        this.update(node, vm, exp, 'html');
    }
    htmlUpdater(node, value) {
        node.innerHTML = value;  
    }
    // 事件处理.exp为事件名，dir为触发事件的类型
    eventHandler(node, vm, exp, dir) {
        let fn = vm.$options.methods && vm.$options.methods[exp];
        if(fn && dir) {
            node.addEventListener(dir, fn.bind(vm));
        }
    }
}