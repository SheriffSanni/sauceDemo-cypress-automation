import {
    loginPage 
} from "../pageObjects/LoginPage";

import { finishPage } from "../pageObjects/FinishPage";
import { checkout } from "../pageObjects/Checkout";
import { generic } from "../pageObjects/Generic";
import { cart } from "../pageObjects/Cart";
import { productsPage } from "../pageObjects/ProductsPage";

let password = Cypress.env('userPassword')

describe('Swag Labs tests', () => {
    before(function () {
        cy.visit(Cypress.env('baseUrl'));
    });

    beforeEach(function () {
        cy.fixture('user')
            .then((user) => {
                this.user = user
            });
        cy.fixture('items')
            .then((items) => {
                this.items = items
            })
    })

    it('should log in with standard user', function () {
        cy.get(loginPage.userName).type(this.user.userName);
        cy.get(loginPage.passWord).type(password);
        cy.get(loginPage.loginButton).click();
        cy.get(productsPage.productLabel).should('be.visible').and('contain.text', productsPage.title);
    });

    it('should add an item to the cart', function () {
        cy.login()
        cy.get(productsPage.shoppingCartBadge).should('not.exist');
        cy.get(productsPage.item).each((e1) => {
            if (e1.find(productsPage.itemName).text().includes(this.items[0].name)) {
                e1.find(`button`).trigger('click')
            }
        });
        cy.get(productsPage.shoppingCartBadge)
            .then((e) => {
                expect(Number(e.text())).to.equal(1)
            })
    });

    it('should have 6 items on the inventory page', function () {
        cy.login()
        cy.get(productsPage.item).its('length').should('eq', 6)
    });

    it('should complete the purchase process of an item from the inventory', function () {
        cy.login();
        cy.get(productsPage.item).each((e1) => {
            if (e1.find(productsPage.itemName).text().includes(this.items[0].name)) {
                e1.find(`button`).trigger('click');
            };
        });
        cy.get(productsPage.shoppingCart).click();
        cy.location().its('pathname').should('equal', '/cart.html')
        cy.get(generic.subHeader).should('contain.text', cart.title)


        cy.get(cart.cartItem).find(cart.noOfItemsInCart).then((e) => {
            expect(Number(e.text())).to.equal(1)
        });
        cy.get(cart.checkoutButton).click();
        cy.get(generic.subHeader).should('contain.text', checkout.userInfoPageTitle)
        cy.location().its('pathname').should('equal', '/checkout-step-one.html')

        cy.get(checkout.firstName).type(this.user.firstName)
        cy.get(checkout.lastName).type(this.user.lastName)
        cy.get(checkout.postalCode).type(this.user.postalCode)
        cy.get(checkout.continueButton).contains('CONTINUE').click();

        cy.location().its('pathname').should('equal', '/checkout-step-two.html');
        cy.get(generic.subHeader).should('contain.text', checkout.overViewPageTitle)
        cy.get(cart.cartItem).find(cart.itemPrice).then((e) => {
            expect(e.text()).to.eq(this.items[0].price)
        });
        cy.get(checkout.tax).then((e) => {
            expect(e.text().split(`:`)[1].trim()).to.eq(this.items[0].tax)
        });
        cy.get(checkout.itemsTotalPrice).then((e) => {
            expect(e.text().split(`:`)[1].trim()).to.eq(this.items[0].price)
        });
        cy.get(checkout.checkoutButton).contains('FINISH').click()
        cy.get(generic.subHeader).should('contain.text', 'Finish');

        cy.location().its('pathname').should('equal', '/checkout-complete.html')
        cy.get(finishPage.img).invoke('attr', 'src').should('contain', finishPage.imageName)

    })

    it('sort the inventory items by price, high-to-low', function () {
        cy.login();
        cy.get(productsPage.filter).select(`hilo`)
        cy.get(productsPage.item).each((e1, index, list) => {
            if (index != list.length - 1) {
                expect(Number(list[index].getElementsByClassName('inventory_item_price')[0].textContent.split(`$`)[1]))
                    .to.be.gte(Number(list[index + 1].getElementsByClassName('inventory_item_price')[0].textContent.split(`$`)[1]))
            }
        })
    });

    it('sort the inventory items by name, Z-to-A', function () {
        cy.login();
        cy.get(productsPage.filter).select(`za`)
        let previousName = ""
        cy.get(productsPage.item).each((e1, index, list) => {
            let itemName = e1.find(productsPage.itemName).text()
            if (index == 0) {
                previousName = itemName
            } else {
                expect(previousName > itemName).to.equal(true, `${previousName} > ${itemName}`)
                previousName = itemName
            }
        })
    });

    it('Add multiple items to cart', function () {
        cy.login();
        cy.get(productsPage.item).each((e1) => {
            if (e1.find(productsPage.itemName).text().includes(this.items[0].name)) {
                e1.find(`button`).trigger('click');
            };
        });
    })
})