class KVue {
    constructor(options) {
        this.$options = options;
        this.$data = options.data;
        this.observe(this.$data);
        new Compile(options.el, this);
        options.created.call(this);
    }

    observe(obj) {
        if(!obj || typeof obj !== 'object') {
            return;
        }
        // 遍历
        Object.keys(obj).forEach(key => {
            this.defineReactive(obj, key, obj[key]);
            // 代理data中属性到vue实例上
            this.proxyData(key);
        });
    }

    //数据绑定
    defineReactive(obj, key, value) {
        // 递归，深度遍历
        this.observe(value);
        const dep = new Dep(); // 每个变量有一个Dep实例
        Object.defineProperty(obj, key, {
            get () {
                Dep.target && dep.addDep(Dep.target);
                return value;
            },
            set(newVal) {
                if(newVal === value) return value;
                value = newVal;
                dep.notify();
            }
        })
    }

    // 数据代理
    proxyData(key) {
        Object.defineProperty(this, key, {
            get() {
                return this.$data[key];
            },
            set(newVal) {
                this.$data[key] = newVal;
            }
        })
    }
}

// Dep: 用来管理Watcher
class Dep {
    constructor() {
        // 存放若干个依赖（watcher）
        this.deps = [];
    }
    addDep(dep) {
        this.deps.push(dep);
    }
    notify() {
        // 通知watcher 进行更新
        this.deps.forEach(dep => dep.update());
    }
}

class Watcher {
    constructor(vm, key, callback) {
        this.vm = vm;
        this.key = key;
        this.callback = callback;
        // 将当前watcher实例指向Dep的静态属性target
        Dep.target = this; // 本质是个标记过程，透过target将watcher放到收集的依赖数组里
        this.vm[this.key]; // 触发getter，添加依赖
        Dep.target = null; // 标记完后再恢复
    }
    update() {
        // 触发回调函数
        this.callback.call(this.vm, this.vm[this.key]);
    }
}