
def reverse_string(string1):
    
### 1st way

    # string2=""

    # for char in string1:
    #     string2=char+string2
    # return string2
   
### 2nd way and it is used to check the palindrome

    return string1[::-1]

print(reverse_string("Hello"))

### second largest

def second_largest(arr):

    arr=list(set(arr))
    arr.sort
    return arr[-2]

print(second_largest([1,2,34,5,4]))


from collections import Counter

s = "banana"
print(Counter(s))
